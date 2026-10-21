/**
 * Mint an admin session cookie for browser checks.
 *
 * The admin sign-in is a magic link, and the link goes to an inbox this
 * machine cannot read. So the session is minted directly: a link is generated
 * through the admin API, its token is verified against the auth API, and the
 * resulting session is encoded the way `@supabase/ssr` encodes it — the same
 * value the browser would hold after a real sign-in.
 *
 * Usage: node scripts/admin-session.mjs
 * Prints the cookie name and value to paste into the browser.
 */
import { createClient } from "@supabase/supabase-js";
import { createChunks } from "@supabase/ssr/dist/main/utils/chunker.js";
import { stringToBase64URL } from "@supabase/ssr/dist/main/utils/base64url.js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2] ?? "kelvinramsiel@gmail.com";

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: link, error: linkError } = await admin.auth.admin.generateLink({
  type: "magiclink",
  email,
});
if (linkError) throw linkError;

const { data, error: verifyError } = await createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}).auth.verifyOtp({
  type: "magiclink",
  token_hash: link.properties.hashed_token,
});
if (verifyError) throw verifyError;

// The response is `{ user, session }`; the storage holds the session itself.
const session = data.session;

const projectRef = new URL(url).hostname.split(".")[0];
const key = `sb-${projectRef}-auth-token`;
const encoded = `base64-${stringToBase64URL(JSON.stringify(session))}`;

console.log(JSON.stringify({ key, cookies: createChunks(key, encoded) }, null, 2));
