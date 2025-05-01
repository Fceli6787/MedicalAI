export const authConfig = {
  providers: [],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.id_usuario = user.id
      return token
    },
    async session({ session, token }: any) {
      if (session.user) session.user.id_usuario = token.id_usuario
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
