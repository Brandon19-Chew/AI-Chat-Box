import { View, Text, Pressable, Alert, ActivityIndicator, Switch, ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "@/lib/theme-provider";
import { useLanguage, LANGUAGE_LABELS, type Language } from "@/lib/language-provider";
import { getAllReleases } from "@/lib/release-notes";
import { FEEDBACK_CATEGORIES, FEEDBACK_CATEGORY_ICONS, validateFeedback, type FeedbackCategory, type FeedbackSubmission } from "@/lib/feedback";
import { useFontSize, type FontSizeScale, FONT_SIZE_MULTIPLIERS } from "@/lib/font-size-context";
import { useTranslation } from "@/lib/translations";

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colors = useColors();
  const { colorScheme, setColorScheme } = useThemeContext();
  const { language, setLanguage } = useLanguage();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showWhatsNewModal, setShowWhatsNewModal] = useState(false);
  const [expandedRelease, setExpandedRelease] = useState<string | null>("1.0.0");
  const releases = getAllReleases();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<Partial<FeedbackSubmission>>({
    name: user?.name || "",
    email: user?.email || "",
    category: "other",
    subject: "",
    message: "",
  });
  const [feedbackErrors, setFeedbackErrors] = useState<string[]>([]);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const { fontSizeScale, setFontSizeScale, fontSizeMultiplier } = useFontSize();
  const t = useTranslation(language);

  const submitFeedbackMutation = trpc.feedback.submit.useMutation();

  const deleteAllConversationsMutation = trpc.chat.deleteAllConversations.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "All conversations have been deleted.");
    },
    onError: (error: any) => {
      Alert.alert("Error", "Failed to delete conversations.");
      console.error("Delete all conversations error:", error);
    },
  });

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", onPress: () => {} },
      {
        text: "Logout",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
        style: "destructive",
      },
    ]);
  };

  const handleClearAllConversations = () => {
    Alert.alert(
      "Clear All Conversations",
      "This will permanently delete all your conversations. This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete All",
          onPress: () => deleteAllConversationsMutation.mutate(),
          style: "destructive",
        },
      ]
    );
  };

  const toggleTheme = () => {
    const newScheme = colorScheme === "light" ? "dark" : "light";
    setColorScheme(newScheme);
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === language) {
      setShowLanguageModal(false);
      return;
    }

    setIsChangingLanguage(true);
    try {
      await setLanguage(newLanguage);
      setShowLanguageModal(false);
      
      
    } catch (error) {
      Alert.alert("Error", "Failed to change language");
      console.error("Language change error:", error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  const handleSubmitFeedback = async () => {
    const validation = validateFeedback(feedbackForm);
    
    if (!validation.valid) {
      setFeedbackErrors(validation.errors);
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackErrors([]);

    try {
      await submitFeedbackMutation.mutateAsync({
        name: feedbackForm.name,
        email: feedbackForm.email,
        category: feedbackForm.category as any,
        subject: feedbackForm.subject,
        message: feedbackForm.message,
      });
      
      setFeedbackSubmitted(true);
      Alert.alert(
        "Thank You!",
        "Your feedback has been submitted successfully. We appreciate your input!",
        [
          {
            text: "OK",
            onPress: () => {
              setShowFeedbackModal(false);
              setFeedbackSubmitted(false);
              setFeedbackForm({
                name: user?.name || "",
                email: user?.email || "",
                category: "other",
                subject: "",
                message: "",
              });
            },
          },
        ]
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit feedback. Please try again.";
      Alert.alert("Error", errorMessage);
      console.error("Feedback submission error:", error);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="pb-4 border-b border-border flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text className="text-lg font-semibold text-foreground ml-2">{t('settings.title')}</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={true}>
        {/* User Profile Section */}
        <View className="mt-6 px-4">
        <Text className="text-sm font-semibold text-muted uppercase mb-3">Account</Text>
        <View className="bg-surface border border-border rounded-lg p-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
              <Text className="text-background font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">
                {user?.name || "User"}
              </Text>
              <Text className="text-sm text-muted">{user?.email}</Text>
            </View>
          </View>
        </View>
        </View>

        {/* Preferences Section */}
        <View className="mt-6 px-4">
        <Text className="text-sm font-semibold text-muted uppercase mb-3">Preferences</Text>
        <View className="bg-surface border border-border rounded-lg overflow-hidden">
          {/* Theme Toggle */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <Ionicons
                name={colorScheme === "dark" ? "moon" : "sunny"}
                size={20}
                color={colors.primary}
              />
              <Text className="text-base text-foreground">
                {colorScheme === "dark" ? "Dark Mode" : "Light Mode"}
              </Text>
            </View>
            <Switch
              value={colorScheme === "dark"}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>

          {/* Language Selector */}
          <Pressable
            onPress={() => setShowLanguageModal(true)}
            disabled={isChangingLanguage}
            className="flex-row items-center justify-between p-4 disabled:opacity-50"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="globe" size={20} color={colors.primary} />
              <Text className="text-base text-foreground">Language</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-muted">{LANGUAGE_LABELS[language]}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </View>
          </Pressable>

          {/* Font Size Adjustment */}
          <View className="border-t border-border p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="text" size={20} color={colors.primary} />
                <Text className="text-base text-foreground">Font Size</Text>
              </View>
              <Text className="text-sm text-muted capitalize">{fontSizeScale}</Text>
            </View>
            <View className="flex-row gap-2 justify-between">
              {(['small', 'medium', 'large', 'extra-large'] as FontSizeScale[]).map((size) => {
                const isSelected = fontSizeScale === size;
                return (
                  <Pressable
                    key={size}
                    onPress={() => setFontSizeScale(size)}
                    className={isSelected ? 'flex-1 py-2 px-2 rounded-lg bg-primary border border-primary' : 'flex-1 py-2 px-2 rounded-lg bg-background border border-border'}
                    style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text
                      className={isSelected ? 'text-center font-semibold text-background' : 'text-center font-semibold text-foreground'}
                      style={{ fontSize: 12 * FONT_SIZE_MULTIPLIERS[size] }}
                    >
                      {size === 'extra-large' ? 'XL' : size.charAt(0).toUpperCase()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
        </View>

        {/* Data Section */}
        <View className="mt-6 px-4">
        <Text className="text-sm font-semibold text-muted uppercase mb-3">Data</Text>
        <Pressable
          onPress={handleClearAllConversations}
          disabled={deleteAllConversationsMutation.isPending}
          className="bg-surface border border-error rounded-lg p-4 flex-row items-center justify-between disabled:opacity-50"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name="trash" size={20} color={colors.error} />
            <Text className="text-base text-error font-semibold">Clear All Conversations</Text>
          </View>
          {deleteAllConversationsMutation.isPending && (
            <ActivityIndicator color={colors.error} size="small" />
          )}
        </Pressable>
        </View>

        {/* What's New Section */}
        <View className="mt-6 px-4">
        <Text className="text-sm font-semibold text-muted uppercase mb-3">What's New</Text>
        <Pressable
          onPress={() => setShowWhatsNewModal(true)}
          className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <View className="flex-row items-center gap-3 flex-1">
            <Ionicons name="sparkles" size={20} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-base text-foreground font-semibold">Release Notes</Text>
              <Text className="text-xs text-muted mt-1">View latest updates and features</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
        </View>

        {/* Feedback and Support Section */}
        <View className="mt-6 px-4">
        <Text className="text-sm font-semibold text-muted uppercase mb-3">Support</Text>
        <Pressable
          onPress={() => setShowFeedbackModal(true)}
          className="bg-surface border border-border rounded-lg p-4 flex-row items-center justify-between"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <View className="flex-row items-center gap-3 flex-1">
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
            <View className="flex-1">
              <Text className="text-base text-foreground font-semibold">Feedback & Support</Text>
              <Text className="text-xs text-muted mt-1">Send us your feedback or report issues</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>
        </View>

        {/* About Section */}
        <View className="mt-6 px-4">
        <Text className="text-sm font-semibold text-muted uppercase mb-3">About</Text>
        <View className="bg-surface border border-border rounded-lg overflow-hidden">
          {/* App Version */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <View>
                <Text className="text-base text-foreground">App Version</Text>
                <Text className="text-xs text-muted mt-1">Build date: Feb 24, 2026</Text>
              </View>
            </View>
            <Text className="text-sm font-semibold text-primary">1.0.0</Text>
          </View>

          {/* Terms of Use */}
          <Pressable
            onPress={() => setShowTermsModal(true)}
            className="flex-row items-center justify-between p-4 border-b border-border"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text className="text-base text-foreground">Terms of Use</Text>
            </View>
            <Pressable
              onPress={() => setShowTermsModal(true)}
              className="px-3 py-1.5 border border-primary rounded-full"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-sm font-semibold text-primary">View</Text>
            </Pressable>
          </Pressable>

          {/* Privacy Policy */}
          <Pressable
            onPress={() => setShowPrivacyModal(true)}
            className="flex-row items-center justify-between p-4"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <View className="flex-row items-center gap-3">
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
              <Text className="text-base text-foreground">Privacy Policy</Text>
            </View>
            <Pressable
              onPress={() => setShowPrivacyModal(true)}
              className="px-3 py-1.5 border border-primary rounded-full"
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Text className="text-sm font-semibold text-primary">View</Text>
            </Pressable>
          </Pressable>
        </View>
      </View>

        {/* Logout Section */}
        <View className="mt-6 px-4 pb-6">
        <Pressable
          onPress={handleLogout}
          className="bg-error rounded-lg p-4 items-center justify-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
        >
          <Text className="text-base font-semibold text-background">Logout</Text>
        </Pressable>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">Select Language</Text>
              <Pressable onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Language Options */}
            <ScrollView className="max-h-96">
              {(Object.entries(LANGUAGE_LABELS) as Array<[Language, string]>).map(([lang, label]) => (
                <Pressable
                  key={lang}
                  onPress={() => handleLanguageChange(lang)}
                  disabled={isChangingLanguage}
                  className="flex-row items-center justify-between p-4 border-b border-border disabled:opacity-50"
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text className={`text-base ${
                    language === lang ? "font-semibold text-primary" : "text-foreground"
                  }`}>
                    {label}
                  </Text>
                  {language === lang && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms of Use Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 flex-1" style={{ maxHeight: '80%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">Terms of Use</Text>
              <Pressable onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView className="flex-1">
              <View className="gap-4">
                {/* Section 1 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">1. Acceptance of Terms</Text>
                  <Text className="text-sm text-foreground leading-relaxed">By accessing and using Zrytium AI, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</Text>
                </View>

                {/* Section 2 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">2. Use License</Text>
                  <Text className="text-sm text-foreground leading-relaxed mb-2">Permission is granted to temporarily download one copy of the materials (information or software) on Zrytium AI for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</Text>
                  <View className="ml-4 gap-1">
                    <Text className="text-sm text-foreground">• Modifying or copying the materials</Text>
                    <Text className="text-sm text-foreground">• Using the materials for any commercial purpose or for any public display</Text>
                    <Text className="text-sm text-foreground">• Attempting to decompile or reverse engineer any software contained on Zrytium AI</Text>
                    <Text className="text-sm text-foreground">• Removing any copyright or other proprietary notations from the materials</Text>
                    <Text className="text-sm text-foreground">• Transferring the materials to another person or "mirroring" the materials on any other server</Text>
                  </View>
                </View>

                {/* Section 3 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">3. Disclaimer</Text>
                  <Text className="text-sm text-foreground leading-relaxed">The materials on Zrytium AI are provided on an 'as is' basis. Zrytium AI makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</Text>
                </View>

                {/* Section 4 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">4. Limitations</Text>
                  <Text className="text-sm text-foreground leading-relaxed">In no event shall Zrytium AI or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Zrytium AI, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.</Text>
                </View>

                {/* Section 5 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">5. Accuracy of Materials</Text>
                  <Text className="text-sm text-foreground leading-relaxed">The materials appearing on Zrytium AI could include technical, typographical, or photographic errors. Zrytium AI does not warrant that any of the materials on its website are accurate, complete, or current. Zrytium AI may make changes to the materials contained on its website at any time without notice.</Text>
                </View>

                {/* Section 6 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">6. Links</Text>
                  <Text className="text-sm text-foreground leading-relaxed">Zrytium AI has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Zrytium AI of the site. Use of any such linked website is at the user's own risk.</Text>
                </View>

                {/* Section 7 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">7. Modifications</Text>
                  <Text className="text-sm text-foreground leading-relaxed">Zrytium AI may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.</Text>
                </View>

                {/* Section 8 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">8. Governing Law</Text>
                  <Text className="text-sm text-foreground leading-relaxed">These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Zrytium AI operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* What's New Modal */}
      <Modal
        visible={showWhatsNewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWhatsNewModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 flex-1" style={{ maxHeight: '90%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">What's New</Text>
              <Pressable onPress={() => setShowWhatsNewModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Release Notes */}
            <ScrollView className="flex-1">
              <View className="gap-3">
                {releases.map((release) => (
                  <View key={release.version} className="bg-surface border border-border rounded-lg overflow-hidden">
                    {/* Release Header */}
                    <Pressable
                      onPress={() => setExpandedRelease(expandedRelease === release.version ? null : release.version)}
                      className="flex-row items-center justify-between p-4"
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-base font-semibold text-foreground">Version {release.version}</Text>
                          <View className="bg-primary px-2 py-1 rounded">
                            <Text className="text-xs font-semibold text-background">Latest</Text>
                          </View>
                        </View>
                        <Text className="text-xs text-muted mt-1">{release.date}</Text>
                      </View>
                      <Ionicons
                        name={expandedRelease === release.version ? "chevron-up" : "chevron-down"}
                        size={20}
                        color={colors.primary}
                      />
                    </Pressable>

                    {/* Release Details */}
                    {expandedRelease === release.version && (
                      <View className="border-t border-border p-4 gap-2">
                        {release.highlights.map((highlight, index) => (
                          <Text key={index} className="text-sm text-foreground leading-relaxed">
                            {highlight}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 flex-1" style={{ maxHeight: '80%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">Privacy Policy</Text>
              <Pressable onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView className="flex-1">
              <View className="gap-4">
                {/* Section 1 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">1. Information We Collect</Text>
                  <Text className="text-sm text-foreground leading-relaxed">We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support. This may include your name, email address, and any messages or content you create within the application.</Text>
                </View>

                {/* Section 2 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">2. How We Use Your Information</Text>
                  <Text className="text-sm text-foreground leading-relaxed mb-2">We use the information we collect to:</Text>
                  <View className="ml-4 gap-1">
                    <Text className="text-sm text-foreground">• Provide, maintain, and improve our services</Text>
                    <Text className="text-sm text-foreground">• Process transactions and send related information</Text>
                    <Text className="text-sm text-foreground">• Send technical notices and support messages</Text>
                    <Text className="text-sm text-foreground">• Respond to your comments and questions</Text>
                    <Text className="text-sm text-foreground">• Monitor and analyze trends and usage</Text>
                    <Text className="text-sm text-foreground">• Detect and prevent fraudulent transactions and other illegal activities</Text>
                  </View>
                </View>

                {/* Section 3 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">3. Data Security</Text>
                  <Text className="text-sm text-foreground leading-relaxed">We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is completely secure.</Text>
                </View>

                {/* Section 4 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">4. Third-Party Services</Text>
                  <Text className="text-sm text-foreground leading-relaxed">Our application may use third-party services that may collect information used to identify you. We encourage you to review the privacy policies of these third-party services to understand their practices.</Text>
                </View>

                {/* Section 5 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">5. Data Retention</Text>
                  <Text className="text-sm text-foreground leading-relaxed">We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this privacy policy. You may request deletion of your data at any time.</Text>
                </View>

                {/* Section 6 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">6. Your Rights</Text>
                  <Text className="text-sm text-foreground leading-relaxed mb-2">You have the right to:</Text>
                  <View className="ml-4 gap-1">
                    <Text className="text-sm text-foreground">• Access your personal information</Text>
                    <Text className="text-sm text-foreground">• Correct inaccurate data</Text>
                    <Text className="text-sm text-foreground">• Request deletion of your data</Text>
                    <Text className="text-sm text-foreground">• Opt-out of certain data processing activities</Text>
                  </View>
                </View>

                {/* Section 7 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">7. Children's Privacy</Text>
                  <Text className="text-sm text-foreground leading-relaxed">Our services are not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information and terminate the child's account.</Text>
                </View>

                {/* Section 8 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">8. Changes to This Policy</Text>
                  <Text className="text-sm text-foreground leading-relaxed">We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on our website and updating the "effective date" at the top of this policy.</Text>
                </View>

                {/* Section 9 */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">9. Contact Us</Text>
                  <Text className="text-sm text-foreground leading-relaxed">If you have any questions about this privacy policy or our privacy practices, please contact us at support@zrytium.ai.</Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Feedback and Support Modal */}
      <Modal
        visible={showFeedbackModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-2xl p-6 flex-1" style={{ maxHeight: '95%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">Feedback & Support</Text>
              <Pressable onPress={() => setShowFeedbackModal(false)}>
                <Ionicons name="close" size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Form Content */}
            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 400 }}>
              <View className="gap-4 pb-4">
                {/* Error Messages */}
                {feedbackErrors.length > 0 && (
                  <View className="bg-error/10 border border-error rounded-lg p-3 gap-1">
                    {feedbackErrors.map((error, index) => (
                      <Text key={index} className="text-sm text-error">
                        • {error}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Name Field */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Name</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-base text-foreground"
                    placeholder="Enter your name"
                    placeholderTextColor="#687076"
                    value={feedbackForm.name || ""}
                    onChangeText={(text) => setFeedbackForm({ ...feedbackForm, name: text })}
                  />
                </View>

                {/* Email Field */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-base text-foreground"
                    placeholder="Enter your email"
                    placeholderTextColor="#687076"
                    keyboardType="email-address"
                    value={feedbackForm.email || ""}
                    onChangeText={(text) => setFeedbackForm({ ...feedbackForm, email: text })}
                  />
                </View>

                {/* Category Selector */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Category</Text>
                  <View className="gap-2">
                    {(Object.entries(FEEDBACK_CATEGORIES) as Array<[FeedbackCategory, string]>).map(([category, label]) => (
                      <Pressable
                        key={category}
                        onPress={() => setFeedbackForm({ ...feedbackForm, category })}
                        className={`flex-row items-center gap-3 p-3 rounded-lg border ${
                          feedbackForm.category === category
                            ? "bg-primary/10 border-primary"
                            : "bg-surface border-border"
                        }`}
                        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      >
                        <Ionicons
                          name={FEEDBACK_CATEGORY_ICONS[category]}
                          size={18}
                          color={feedbackForm.category === category ? colors.primary : colors.muted}
                        />
                        <Text className={`text-sm ${
                          feedbackForm.category === category
                            ? "font-semibold text-primary"
                            : "text-foreground"
                        }`}>
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Subject Field */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Subject</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-base text-foreground"
                    placeholder="Enter subject"
                    placeholderTextColor="#687076"
                    value={feedbackForm.subject || ""}
                    onChangeText={(text) => setFeedbackForm({ ...feedbackForm, subject: text })}
                  />
                </View>

                {/* Message Field */}
                <View>
                  <Text className="text-sm font-semibold text-foreground mb-2">Message</Text>
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-base text-foreground"
                    placeholder="Enter your feedback or describe the issue"
                    placeholderTextColor="#687076"
                    multiline={true}
                    numberOfLines={4}
                    value={feedbackForm.message || ""}
                    onChangeText={(text) => setFeedbackForm({ ...feedbackForm, message: text })}
                    textAlignVertical="top"
                  />
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmitFeedback}
                  disabled={isSubmittingFeedback}
                  className="bg-primary rounded-lg p-4 items-center justify-center mt-2 disabled:opacity-50"
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                >
                  {isSubmittingFeedback ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <Text className="text-base font-semibold text-background">Submit Feedback</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
