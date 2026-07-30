import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail, sendSuspiciousLoginEmail } from "@/lib/mailer";
import { sign } from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "2FA Code", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials) return null;

        const { email, password, otp } = credentials;

        await dbConnect();
        const user = await User.findOne({ email });

        if (!user) return null;
        if (!user.verified) throw new Error("Please verify your email first");
        if (user.isAccountLocked) {
          if (user.unblockToken && user.unblockTokenExpires) {
            const isTokenValid = user.unblockTokenExpires > Date.now();
            if (isTokenValid) {
              await sendSuspiciousLoginEmail(user.email, user.unblockToken);
            }
          }
          if (!user.unblockToken && !user.unblockTokenExpires) {
            // Generate a new token and set expiry (1 hour)
            const token = crypto.randomBytes(32).toString("hex");
            user.unblockToken = token;
            user.unblockTokenExpires = Date.now() + 60 * 60 * 1000;
            await user.save();
            await sendSuspiciousLoginEmail(user.email, token);
          }
          throw new Error(
            "Your account is blocked due to suspicious activity.",
          );
        }

        //Handle 2FA login after OTP is already verified
        if (otp && password === "__OTP__") {
          if (!user.is2FAEnabled) return null;
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            gender: user.gender,
            is2FAEnabled: true,
            is2FAVerified: true,
            role: user.role || "user",
            credits: user.credits || 0,
          };
        }

        //Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          user.loginAttempts += 1;
          if (user.loginAttempts >= 3) {
            user.isAccountLocked = true;
            // Generate a token and set expiry (1 hour)
            const token = crypto.randomBytes(32).toString("hex");
            user.unblockToken = token;
            user.unblockTokenExpires = Date.now() + 60 * 60 * 1000;
            await user.save();
            // Send suspicious activity email
            await sendSuspiciousLoginEmail(user.email, token);
            throw new Error(
              "Account blocked due to multiple failed login attempts.",
            );
          }
          await user.save();
          throw new Error("Invalid password");
        }

        // Reset login attempts on successful password verification
        user.loginAttempts = 0;
        await user.save();

        //Trigger 2FA email if enabled
        if (user.is2FAEnabled) {
          const otpCode = Math.floor(
            100000 + Math.random() * 900000,
          ).toString();
          const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
          user.twoFactorOtp = otpCode;
          user.twoFactorOtpExpiry = expiry;
          await user.save();
          await sendEmail({
            from: process.env.EMAIL_USER as string,
            to: user.email,
            subject: "Your 2FA Verification Code",
            text: `Your verification code is: ${otpCode}`,
          });

          return {
            id: user._id.toString(),
            email: user.email,
            requires2FA: true,
            is2FAEnabled: true,
          };
        }

        //Regular login
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          gender: user.gender,
          role: user.role || "user",
          is2FAEnabled: false,
          credits: user.credits || 0,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/login/2fa-verification",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 5, // 5 hours
    updateAge: 60 * 60, // refresh every 1 hour of activity
  },
  jwt: {
    maxAge: 60 * 60 * 5, // tokens are valid for 5 hours max
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        // token.image = user.image;
        // token.gender = user.gender;
        // token.is2FAEnabled = user.is2FAEnabled;
        // token.is2FAVerified = user.is2FAVerified;
        // token.credits = user.credits || 0;
        if (user) {
          token.role = user.role || "user";
        }
        token.accessToken = await sign(token, process.env.NEXTAUTH_SECRET!);
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          name: token.name,
          email: token.email,
          image: token.image,
          gender: token.gender,
          role: token.role as string,
          is2FAEnabled: token.is2FAEnabled,
          is2FAVerified: token.is2FAVerified,
          accessToken: token.accessToken,
          credits: token.credits,
        },
      };
    },
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      if (user.requires2FA) {
        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        return `${baseUrl}/login/2fa-verification?email=${encodeURIComponent(
          user.email ?? "",
        )}`;
      }
      return true;
    },
  },
};
