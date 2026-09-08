import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';

import { AppIcon } from '@/components/ui/app-icon';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { ALL_ROLES, AppRole, ROLE_DEFINITIONS } from '@/constants/roles';
import { useAuth } from '@/context/auth-context';
import { clearRememberedEmail, getRememberedEmail, saveRememberedEmail } from '@/lib/storage';

export default function LoginScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { signIn, signUp, resetPassword } = useAuth();

  const [selectedRole, setSelectedRole] = useState<AppRole>('pcp');
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // Form fields - initialize remembered identifier lazily without cascading renders
  const [email, setEmail] = useState(() => getRememberedEmail() || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [rememberEmail, setRememberEmail] = useState(() => Boolean(getRememberedEmail()));

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoPicker, setShowDemoPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const currentRoleMeta = ROLE_DEFINITIONS[selectedRole];

  function handleRoleSelect(target: AppRole) {
    setSelectedRole(target);
    setFormError(null);
    setInfoMessage(null);
    if (!ROLE_DEFINITIONS[target].allowSelfRegistration && mode === 'signup') {
      setMode('signin');
    }
  }

  function handleQuickFillDemo(targetRole: AppRole) {
    setSelectedRole(targetRole);
    const targetMeta = ROLE_DEFINITIONS[targetRole];
    setEmail(targetMeta.demoCredentials.email);
    // Security best practice: Never auto-populate passwords in client forms
    setPassword('');
    setFormError(null);
    setInfoMessage(`Loaded ${targetMeta.title} account ID. Please enter password.`);
  }

  async function handleSubmit() {
    setFormError(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setFormError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) {
      setFormError('Please enter a valid email address (e.g. user@carelink.local).');
      return;
    }

    if (mode === 'forgot') {
      setSubmitting(true);
      try {
        await resetPassword(cleanEmail);
        setInfoMessage('Password recovery instructions sent to your email.');
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Unable to send reset email.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (selectedRole !== 'patient') {
        setFormError('Staff logins must be provisioned by your Hospital Administrator or Super Admin.');
        return;
      }
      if (!fullName.trim()) {
        setFormError('Please enter your full name.');
        return;
      }
      if (password.length < 8) {
        setFormError('Password must contain at least 8 characters.');
        return;
      }

      setSubmitting(true);
      try {
        await signUp({
          fullName: fullName.trim(),
          email: cleanEmail,
          password,
          role: 'patient',
          facilityName: 'Korle Bu Teaching Hospital',
          facilityId: 'KBTH-01',
        });
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Sign in mode
    setSubmitting(true);
    try {
      await signIn(cleanEmail, password, selectedRole);
      if (rememberEmail) {
        saveRememberedEmail(cleanEmail);
      } else {
        clearRememberedEmail();
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sign in failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.cardWrapper}>
          {/* Header Brand */}
          <View style={styles.header}>
            <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.brandCross}>+</Text>
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>CareLink</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
              Hospital Referral & Capacity Network · Strict RBAC
            </Text>

            <View style={[styles.authorityTag, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <AppIcon ios="shield.lefthalf.filled" android="security" color={colors.primary} size={13} />
              <Text style={[styles.authorityTagText, { color: colors.text }]}>
                Credentials Provisioned by Hospital Admin or Super Admin
              </Text>
            </View>
          </View>

          {/* Role Portal Selector */}
          <View style={styles.rolePickerSection}>
            <Text style={[styles.pickerTitle, { color: colors.textSecondary }]}>
              SELECT TARGET ROLE PORTAL TO ENTER CREDENTIALS
            </Text>

            <View style={styles.rolesGrid}>
              {ALL_ROLES.map((roleKey) => {
                const meta = ROLE_DEFINITIONS[roleKey];
                const isSelected = selectedRole === roleKey;
                return (
                  <Pressable
                    key={roleKey}
                    onPress={() => handleRoleSelect(roleKey)}
                    style={({ pressed }) => [
                      styles.roleChip,
                      {
                        backgroundColor: isSelected ? colors.surface : colors.backgroundElement,
                        borderColor: isSelected ? colors.primary : 'transparent',
                      },
                      pressed && styles.pressed,
                    ]}>
                    <View
                      style={[
                        styles.chipIcon,
                        {
                          backgroundColor: meta.badgeColor.bg,
                          borderColor: meta.badgeColor.border,
                        },
                      ]}>
                      <AppIcon
                        ios={meta.icon.ios}
                        android={meta.icon.android}
                        color={meta.badgeColor.text}
                        size={13}
                      />
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.chipLabel,
                        { color: isSelected ? colors.text : colors.textSecondary },
                        isSelected && styles.chipLabelActive,
                      ]}>
                      {meta.shortTitle}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            {/* Selected Role Banner */}
            <View
              style={[
                styles.selectedRoleBanner,
                {
                  backgroundColor: currentRoleMeta.badgeColor.bg,
                  borderColor: currentRoleMeta.badgeColor.border,
                },
              ]}>
              <AppIcon
                ios={currentRoleMeta.icon.ios}
                android={currentRoleMeta.icon.android}
                color={currentRoleMeta.badgeColor.text}
                size={18}
              />
              <View style={styles.roleBannerTexts}>
                <Text style={[styles.roleBannerTitle, { color: currentRoleMeta.badgeColor.text }]}>
                  {currentRoleMeta.title} Portal
                </Text>
                <Text style={[styles.roleBannerDesc, { color: colors.textSecondary }]}>
                  {currentRoleMeta.description}
                </Text>
              </View>
            </View>

            {/* Quick Demo Fill Accordion (Safe & Collapsible) */}
            <View style={[styles.demoAccordion, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Pressable
                onPress={() => setShowDemoPicker((prev) => !prev)}
                style={styles.demoAccordionHeader}>
                <View style={styles.demoAccordionHeaderLeft}>
                  <AppIcon ios="bolt.shield.fill" android="bolt" color={colors.primary} size={15} />
                  <Text style={[styles.demoAccordionTitle, { color: colors.text }]}>
                    Academic Demo & Defense Accounts (Quick-Select)
                  </Text>
                </View>
                <AppIcon
                  ios={showDemoPicker ? 'chevron.up' : 'chevron.down'}
                  android={showDemoPicker ? 'expand_less' : 'expand_more'}
                  color={colors.textSecondary}
                  size={15}
                />
              </Pressable>

              {showDemoPicker && (
                <View style={styles.demoAccordionBody}>
                  <Text style={[styles.demoAccordionSub, { color: colors.textSecondary }]}>
                    Select a verified role identity for defense testing. Pre-fills email; password entry is required:
                  </Text>
                  <View style={styles.demoChipsGrid}>
                    {ALL_ROLES.map((roleKey) => {
                      const meta = ROLE_DEFINITIONS[roleKey];
                      const isCurr = selectedRole === roleKey;
                      return (
                        <Pressable
                          key={`demo-${roleKey}`}
                          onPress={() => handleQuickFillDemo(roleKey)}
                          style={({ pressed }) => [
                            styles.quickChip,
                            {
                              backgroundColor: isCurr ? colors.surface : colors.background,
                              borderColor: isCurr ? colors.primary : colors.border,
                            },
                            pressed && styles.pressed,
                          ]}>
                          <Text
                            style={[
                              styles.quickChipText,
                              { color: isCurr ? colors.primary : colors.text },
                            ]}>
                            {meta.shortTitle}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.cardHeading}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {mode === 'signin'
                  ? `Sign In as ${currentRoleMeta.shortTitle}`
                  : mode === 'signup'
                    ? 'Register Patient Account'
                    : 'Reset Account Password'}
              </Text>
              <Text style={[styles.cardSubtext, { color: colors.textSecondary }]}>
                {mode === 'signin'
                  ? 'Sign in using the login credentials issued for your account.'
                  : mode === 'signup'
                    ? 'Register your profile to access your referral timeline and medical records.'
                    : 'Enter your registered email to receive password recovery instructions.'}
              </Text>
            </View>

            {/* Error & Info Alerts */}
            {formError ? (
              <View style={[styles.alert, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                <AppIcon ios="exclamationmark.circle.fill" android="error" color={colors.danger} size={18} />
                <Text style={[styles.alertText, { color: colors.danger }]}>{formError}</Text>
              </View>
            ) : null}

            {infoMessage ? (
              <View style={[styles.alert, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                <AppIcon ios="checkmark.circle.fill" android="check_circle" color={colors.primary} size={18} />
                <Text style={[styles.alertText, { color: colors.primary }]}>{infoMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields */}
            {mode === 'signup' && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="e.g. Ama Serwaa Owusu"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  autoComplete="name"
                  textContentType="name"
                  style={[
                    styles.input,
                    { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                />
              </View>
            )}

            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address (Login ID)</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@hospital.gov.gh"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                style={[
                  styles.input,
                  { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
                ]}
              />
            </View>

            {mode !== 'forgot' && (
              <View style={styles.field}>
                <View style={styles.passwordHeader}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                  {mode === 'signin' && (
                    <Pressable onPress={() => setMode('forgot')}>
                      <Text style={[styles.linkText, { color: colors.primary }]}>Forgot?</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.passwordContainer}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                    returnKeyType="done"
                    style={[
                      styles.passwordInput,
                      { color: colors.text, backgroundColor: colors.background, borderColor: colors.border },
                    ]}
                  />
                  <Pressable
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeToggle}>
                    <AppIcon
                      ios={showPassword ? 'eye.slash' : 'eye'}
                      android={showPassword ? 'visibility_off' : 'visibility'}
                      color={colors.textSecondary}
                      size={18}
                    />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Safe Remember My Email Option (OWASP Compliant: Identifier Only) */}
            {mode === 'signin' && (
              <Pressable
                onPress={() => setRememberEmail((prev) => !prev)}
                style={styles.rememberRow}>
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: rememberEmail ? colors.primary : colors.border,
                      backgroundColor: rememberEmail ? colors.primary : 'transparent',
                    },
                  ]}>
                  {rememberEmail && (
                    <AppIcon ios="checkmark" android="check" color="#FFFFFF" size={11} />
                  )}
                </View>
                <Text style={[styles.rememberText, { color: colors.textSecondary }]}>
                  Remember my email ID on this device (Password required)
                </Text>
              </Pressable>
            )}

            {/* Primary Submit Button */}
            <Pressable
              disabled={submitting}
              onPress={handleSubmit}
              style={({ pressed }: { pressed: boolean }) => [
                styles.primaryButton,
                { backgroundColor: colors.primary },
                (pressed || submitting) && styles.pressed,
              ]}>
              {submitting ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <AppIcon
                    ios={mode === 'signin' ? 'arrow.right' : mode === 'signup' ? 'person.badge.plus' : 'envelope'}
                    android="arrow_forward"
                    color={colors.white}
                    size={16}
                  />
                  <Text style={styles.primaryButtonText}>
                    {mode === 'signin'
                      ? `Sign In to ${currentRoleMeta.shortTitle} Portal`
                      : mode === 'signup'
                        ? 'Create Patient Account'
                        : 'Send Recovery Email'}
                  </Text>
                </>
              )}
            </Pressable>

            {/* Mode Switchers */}
            <View style={styles.footerRow}>
              {mode === 'signin' ? (
                <>
                  {selectedRole === 'patient' ? (
                    <Pressable onPress={() => setMode('signup')}>
                      <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Patient without credentials?{' '}
                        <Text style={[styles.footerHighlight, { color: colors.primary }]}>
                          Register Portal Access
                        </Text>
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                      🔒 Need access to {currentRoleMeta.shortTitle}? Request login details from your Hospital Administrator or Super Admin.
                    </Text>
                  )}
                </>
              ) : (
                <Pressable onPress={() => setMode('signin')}>
                  <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                    Already have credentials?{' '}
                    <Text style={[styles.footerHighlight, { color: colors.primary }]}>
                      Sign In
                    </Text>
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    paddingVertical: Spacing.six,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth > 520 ? 500 : MaxContentWidth,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  brandCross: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '500',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  authorityTag: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  authorityTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rolePickerSection: {
    gap: 8,
  },
  pickerTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  roleChip: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  chipLabelActive: {
    fontWeight: '800',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.five,
    gap: Spacing.four,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  selectedRoleBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleBannerTexts: {
    flex: 1,
    gap: 2,
  },
  roleBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  roleBannerDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  demoAccordion: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  demoAccordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  demoAccordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoAccordionTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  demoAccordionBody: {
    padding: 10,
    paddingTop: 2,
    gap: 8,
  },
  demoAccordionSub: {
    fontSize: 10,
    lineHeight: 14,
  },
  demoChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardHeading: {
    gap: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardSubtext: {
    fontSize: 11,
    lineHeight: 16,
  },
  alert: {
    borderRadius: 7,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    height: 42,
    borderRadius: 6,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 42,
    fontSize: 13,
  },
  eyeToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    height: 44,
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  footerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 12,
  },
  footerHighlight: {
    fontWeight: '800',
  },
  noticeText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 15,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});