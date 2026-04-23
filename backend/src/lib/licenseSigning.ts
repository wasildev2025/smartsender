import { importPKCS8, importSPKI, SignJWT, jwtVerify } from 'jose';

// -----------------------------------------------------------------
// License entitlement tokens are short-lived Ed25519-signed JWTs.
//
// The desktop app ships the public key (SS_LICENSE_PUBLIC_KEY) and
// verifies tokens locally. Only the backend holds the private key.
// -----------------------------------------------------------------

const ALG = 'EdDSA';
const ISSUER = 'smartsender.app';
const AUDIENCE = 'smartsender-desktop';

export type LicenseClaims = {
  sub: string;              // license row id
  licenseKey: string;       // last 4 chars only, for UI hinting
  hwid: string;             // bound device
  features: string[];
  plan: string;
  licenseExp: string | null; // actual license expiration date
  // Standard fields (exp, iat, iss, aud) are added by SignJWT.
};

let cachedPrivate: Awaited<ReturnType<typeof importPKCS8>> | null = null;
let cachedPublic: Awaited<ReturnType<typeof importSPKI>> | null = null;

async function getPrivateKey() {
  if (cachedPrivate) return cachedPrivate;
  const pem = process.env.SS_LICENSE_PRIVATE_KEY;
  if (!pem) throw new Error('SS_LICENSE_PRIVATE_KEY is not set');
  cachedPrivate = await importPKCS8(pem.replace(/\\n/g, '\n'), ALG);
  return cachedPrivate;
}

async function getPublicKey() {
  if (cachedPublic) return cachedPublic;
  const pem = process.env.SS_LICENSE_PUBLIC_KEY;
  if (!pem) throw new Error('SS_LICENSE_PUBLIC_KEY is not set');
  cachedPublic = await importSPKI(pem.replace(/\\n/g, '\n'), ALG);
  return cachedPublic;
}

export async function signLicenseToken(
  claims: LicenseClaims,
  ttlSeconds: number = 24 * 60 * 60,
): Promise<string> {
  const key = await getPrivateKey();
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: ALG, typ: 'JWT' })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key);
}

export async function verifyLicenseToken(token: string): Promise<LicenseClaims & { exp: number; iat: number }> {
  const key = await getPublicKey();
  const { payload } = await jwtVerify(token, key, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
  });
  return payload as LicenseClaims & { exp: number; iat: number };
}
