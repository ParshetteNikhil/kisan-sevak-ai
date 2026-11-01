/** Binds the user's language to an AI server action: fn(idToken, input, locale). */
export function withLocale<I, O>(
  fn: (idToken: string, input: I, locale?: string) => Promise<O>,
  locale: string
) {
  return (idToken: string, input: I) => fn(idToken, input, locale);
}
