const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const parseRequestedRoleFromState = (state) => {
  if (!state) return "student";

  try {
    const parsed = JSON.parse(state);
    if (parsed?.role === "teacher" || parsed?.role === "student") {
      return parsed.role;
    }
  } catch (_) {
    // Ignore non-JSON states and try querystring fallback.
  }

  try {
    const params = new URLSearchParams(state);
    const role = params.get("role");
    if (role === "teacher" || role === "student") {
      return role;
    }
  } catch (_) {
    // Ignore invalid querystring state.
  }

  return "student";
};

/**
 * Configure Passport Google OAuth 2.0 Strategy
 */
const configurePassport = (app = null) => {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Google OAuth Strategy (only if credentials are configured)
  const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_ID.includes("your-google");
  
  if (googleConfigured) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          scope: ["profile", "email"],
          passReqToCallback: true,
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            // Extract profile information
            const email = profile.emails[0].value;
            const googleId = profile.id;
            const name = profile.displayName;
            const avatar = profile.photos?.[0]?.value;
            const requestedRole = parseRequestedRoleFromState(req.query?.state);

            // Check if user already exists
            let user = await User.findOne({ $or: [{ email }, { googleId }] });

            if (user) {
              if (requestedRole && user.role !== requestedRole) {
                return done(null, false, {
                  message: `This Google account is registered as a ${user.role}, not a ${requestedRole}. Please select the correct role.`,
                });
              }

              // Update Google ID if logging in via Google for first time
              if (!user.googleId) {
                user.googleId = googleId;
                user.isEmailVerified = true;
                if (avatar && !user.avatar) {
                  user.avatar = avatar;
                }
                await user.save();
              }
              return done(null, user);
            }

            // Create new user if doesn't exist
            user = await User.create({
              email,
              googleId,
              name,
              avatar,
              isEmailVerified: true,
              role: requestedRole || "student",
            });

            return done(null, user);
          } catch (error) {
            console.error("Google OAuth error:", error);
            return done(error, null);
          }
        }
      )
    );
    console.log("✅ Google OAuth strategy configured");
  } else {
    console.log("⚠️  Google OAuth not configured - using email/password auth only");
  }

  // Store flag on app if provided
  if (app) {
    app.set("googleStrategyConfigured", googleConfigured);
  }
};

module.exports = configurePassport;
