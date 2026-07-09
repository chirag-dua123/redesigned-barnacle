/**
 * Phase 9 Verification Script
 *
 * Runs through every checklist item from Phase 9 of the README:
 *   - /ping works
 *   - Registration succeeds for a new user
 *   - Duplicate registration is rejected
 *   - Login works with valid credentials
 *   - Login fails with invalid credentials
 *   - Protected routes reject requests without a valid cookie
 *   - Role-protected routes reject the wrong role
 *   - Gate assignment persists correctly
 *   - Fuel log creation persists correctly
 *
 * Prerequisites:
 *   1. MongoDB must be reachable via MONGO_URI in .env
 *   2. Run `npm run seed` first to populate baseline data
 *   3. Start the server with `npm run dev` in another terminal
 *   4. Then run: node bin/verify.js
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

const log = (ok, label, detail) => {
  if (ok) {
    passed++;
    console.log(`  ✅  ${label}`);
  } else {
    failed++;
    console.log(`  ❌  ${label}`);
    if (detail) console.log(`      → ${detail}`);
  }
};

/**
 * Minimal fetch wrapper that returns { status, body, cookies }.
 * Carries a cookie jar between calls via the `jar` argument.
 */
const request = async (method, path, { body, cookie } = {}) => {
  const url = `${BASE}${path}`;
  const headers = {};

  if (body) headers["Content-Type"] = "application/json";
  if (cookie) headers["Cookie"] = cookie;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
  });

  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch {
    // Not JSON — that's fine for EJS pages
  }

  // Extract set-cookie header
  const setCookie = res.headers.get("set-cookie") || "";

  return { status: res.status, body: json, text, setCookie };
};

/**
 * Extract the token cookie string from a set-cookie header for reuse.
 */
const extractTokenCookie = (setCookieHeader) => {
  const match = setCookieHeader.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
};

// ── Test suites ──────────────────────────────────────────────────────────────

const unique = `verify_${Date.now()}`;

const verifyPing = async () => {
  console.log("\n── /ping ──");
  const res = await request("GET", "/ping");
  log(res.status === 200 && res.body?.message === "Pong", "GET /ping returns 200 with Pong");
  log(res.body?.success === true, "Response includes success: true");
};

const verifyRegistration = async () => {
  console.log("\n── Registration ──");

  // Successful registration
  const res = await request("POST", "/api/auth/register", {
    body: {
      name: "Verify User",
      email: `${unique}@aerocommand.local`,
      password: "TestPass123!",
      role: "ground_staff",
    },
  });
  log(res.status === 201, "Register new user → 201", `Got ${res.status}`);
  log(res.body?.success === true, "Response includes success: true");
  log(res.body?.user?.email === `${unique}@aerocommand.local`, "Response includes user object");
  log(!res.body?.user?.password, "Password hash is NOT in response");

  // Duplicate registration
  const dup = await request("POST", "/api/auth/register", {
    body: {
      name: "Verify User",
      email: `${unique}@aerocommand.local`,
      password: "TestPass123!",
      role: "ground_staff",
    },
  });
  log(dup.status === 409, "Duplicate registration → 409", `Got ${dup.status}`);
  log(dup.body?.success === false, "Response includes success: false");

  // Missing fields
  const bad = await request("POST", "/api/auth/register", {
    body: { name: "No Email" },
  });
  log(bad.status === 400, "Missing fields → 400", `Got ${bad.status}`);

  // Invalid role
  const badRole = await request("POST", "/api/auth/register", {
    body: {
      name: "Bad Role",
      email: `badrole_${unique}@aerocommand.local`,
      password: "TestPass123!",
      role: "admin",
    },
  });
  log(badRole.status === 400, "Invalid role → 400", `Got ${badRole.status}`);
};

const verifyLogin = async () => {
  console.log("\n── Login ──");

  // Valid credentials (uses the user we just registered)
  const res = await request("POST", "/api/auth/login", {
    body: {
      email: `${unique}@aerocommand.local`,
      password: "TestPass123!",
    },
  });
  log(res.status === 200, "Login with valid creds → 200", `Got ${res.status}`);
  log(res.body?.success === true, "Response includes success: true");
  log(res.setCookie.includes("token="), "Response sets auth cookie");
  log(res.setCookie.toLowerCase().includes("httponly"), "Cookie is HttpOnly");

  // Wrong password
  const bad = await request("POST", "/api/auth/login", {
    body: {
      email: `${unique}@aerocommand.local`,
      password: "WrongPassword",
    },
  });
  log(bad.status === 401, "Wrong password → 401", `Got ${bad.status}`);
  log(bad.body?.success === false, "Response includes success: false");

  // Non-existent user
  const noUser = await request("POST", "/api/auth/login", {
    body: {
      email: "nobody@nowhere.local",
      password: "irrelevant",
    },
  });
  log(noUser.status === 401, "Non-existent user → 401", `Got ${noUser.status}`);

  // Missing fields
  const empty = await request("POST", "/api/auth/login", { body: {} });
  log(empty.status === 400, "Missing credentials → 400", `Got ${empty.status}`);
};

const verifyAuthProtection = async () => {
  console.log("\n── Auth protection ──");

  // No cookie → 401
  const flights = await request("GET", "/api/traffic/flights");
  log(flights.status === 401, "GET /api/traffic/flights without cookie → 401", `Got ${flights.status}`);

  const gates = await request("GET", "/api/ground/gates");
  log(gates.status === 401, "GET /api/ground/gates without cookie → 401", `Got ${gates.status}`);

  // Invalid cookie → 401
  const bad = await request("GET", "/api/traffic/flights", {
    cookie: "token=invalid.jwt.garbage",
  });
  log(bad.status === 401, "Invalid cookie → 401", `Got ${bad.status}`);
};

const verifyRoleProtection = async () => {
  console.log("\n── Role protection ──");

  // Login as ground_staff
  const groundLogin = await request("POST", "/api/auth/login", {
    body: {
      email: `${unique}@aerocommand.local`,
      password: "TestPass123!",
    },
  });
  const groundCookie = extractTokenCookie(groundLogin.setCookie);

  // ground_staff should NOT be able to PATCH flight status (controller-only)
  const patch = await request("PATCH", "/api/traffic/status/000000000000000000000000", {
    cookie: groundCookie,
    body: { status: "boarding" },
  });
  log(patch.status === 403, "ground_staff PATCH /api/traffic/status → 403", `Got ${patch.status}`);
  log(patch.body?.success === false, "Response includes success: false");

  // Login as controller (uses seed user)
  const ctrlLogin = await request("POST", "/api/auth/login", {
    body: {
      email: "controller@aerocommand.local",
      password: "Password123!",
    },
  });
  const ctrlCookie = extractTokenCookie(ctrlLogin.setCookie);

  if (!ctrlCookie) {
    log(false, "Controller login failed — cannot continue role tests", "Seed user may be missing");
    return { groundCookie, ctrlCookie: null };
  }

  // controller should NOT be able to POST refuel (ground_staff-only)
  const refuel = await request("POST", "/api/ground/refuel", {
    cookie: ctrlCookie,
    body: { flightId: "000000000000000000000000", gallonsFueled: 100 },
  });
  log(refuel.status === 403, "controller POST /api/ground/refuel → 403", `Got ${refuel.status}`);

  return { groundCookie, ctrlCookie };
};

const verifyGateAssignment = async (cookies) => {
  console.log("\n── Gate assignment ──");

  const { groundCookie } = cookies;
  if (!groundCookie) {
    log(false, "Skipped — no auth cookie available");
    return;
  }

  // Fetch flights to find a real ID
  // We need a controller or ground_staff cookie — flights endpoint requires auth
  const flightsRes = await request("GET", "/api/traffic/flights", { cookie: groundCookie });
  if (flightsRes.status !== 200 || !flightsRes.body?.flights?.length) {
    log(false, "Cannot fetch flights to test gate assignment", `Status: ${flightsRes.status}`);
    return;
  }
  const flight = flightsRes.body.flights[0];

  // Fetch gates to find an available one
  const gatesRes = await request("GET", "/api/ground/gates", { cookie: groundCookie });
  if (gatesRes.status !== 200 || !gatesRes.body?.gates?.length) {
    log(false, "Cannot fetch gates to test gate assignment", `Status: ${gatesRes.status}`);
    return;
  }
  const availableGate = gatesRes.body.gates.find((g) => g.status === "available");
  if (!availableGate) {
    log(false, "No available gate in seed data to test assignment");
    return;
  }

  // Assign gate
  const assign = await request("POST", "/api/ground/assign-gate", {
    cookie: groundCookie,
    body: { gateId: availableGate.gateId, flightId: flight._id },
  });
  log(assign.status === 200, `Assign gate ${availableGate.gateId} → 200`, `Got ${assign.status}`);
  log(assign.body?.success === true, "Response includes success: true");
  log(assign.body?.gate?.status === "occupied", "Gate status is now 'occupied'");
  log(
    assign.body?.gate?.currentFlight?.flightNumber === flight.flightNumber,
    "Gate references the correct flight",
  );

  // Verify persistence — re-fetch gates
  const verify = await request("GET", "/api/ground/gates", { cookie: groundCookie });
  const updatedGate = verify.body?.gates?.find((g) => g.gateId === availableGate.gateId);
  log(updatedGate?.status === "occupied", "Gate assignment persisted on re-fetch");
};

const verifyFuelLog = async (cookies) => {
  console.log("\n── Fuel log creation ──");

  const { groundCookie } = cookies;
  if (!groundCookie) {
    log(false, "Skipped — no auth cookie available");
    return;
  }

  // Fetch a flight ID
  const flightsRes = await request("GET", "/api/traffic/flights", { cookie: groundCookie });
  if (flightsRes.status !== 200 || !flightsRes.body?.flights?.length) {
    log(false, "Cannot fetch flights to test fuel log", `Status: ${flightsRes.status}`);
    return;
  }
  const flight = flightsRes.body.flights[0];

  // Log refueling
  const res = await request("POST", "/api/ground/refuel", {
    cookie: groundCookie,
    body: { flightId: flight._id, gallonsFueled: 250 },
  });
  log(res.status === 201, "Log refueling → 201", `Got ${res.status}`);
  log(res.body?.success === true, "Response includes success: true");
  log(res.body?.fuelLog?.gallonsFueled === 250, "gallonsFueled matches input");
  log(res.body?.fuelLog?.flightId === flight._id, "flightId matches input");
  log(typeof res.body?.fuelLog?.loggedBy === "string", "loggedBy is populated");

  // Bad input — missing fields
  const bad = await request("POST", "/api/ground/refuel", {
    cookie: groundCookie,
    body: {},
  });
  log(bad.status === 400, "Missing fields → 400", `Got ${bad.status}`);

  // Bad input — non-existent flight
  const noFlight = await request("POST", "/api/ground/refuel", {
    cookie: groundCookie,
    body: { flightId: "000000000000000000000000", gallonsFueled: 100 },
  });
  log(noFlight.status === 404, "Non-existent flight → 404", `Got ${noFlight.status}`);

  // Bad input — gallons <= 0
  const zeroGal = await request("POST", "/api/ground/refuel", {
    cookie: groundCookie,
    body: { flightId: flight._id, gallonsFueled: 0 },
  });
  log(zeroGal.status === 400, "gallonsFueled=0 → 400", `Got ${zeroGal.status}`);
};

const verifyConsistentErrorFormat = async () => {
  console.log("\n── Consistent error responses ──");

  // 404 route
  const notFound = await request("GET", "/api/this-does-not-exist");
  log(notFound.status === 404, "Unknown route → 404", `Got ${notFound.status}`);
  log(notFound.body?.success === false, "404 response has success: false");
  log(typeof notFound.body?.message === "string", "404 response has message string");

  // Invalid ObjectId in URL
  const badId = await request("PATCH", "/api/traffic/status/not-an-id", {
    cookie: "token=invalid",
    body: { status: "boarding" },
  });
  // Should get 401 (no valid auth) — but the format should be consistent
  log(badId.body?.success === false, "Error response has success: false");
};

// ── Runner ───────────────────────────────────────────────────────────────────

const run = async () => {
  console.log("═══════════════════════════════════════════════");
  console.log("  AeroCommand — Phase 9 Verification");
  console.log("═══════════════════════════════════════════════");

  try {
    // Quick connectivity check
    const ping = await request("GET", "/ping").catch(() => null);
    if (!ping || ping.status !== 200) {
      console.error("\n❌ Cannot reach the server at", BASE);
      console.error("   Make sure the server is running: npm run dev\n");
      process.exit(1);
    }

    await verifyPing();
    await verifyRegistration();
    await verifyLogin();
    await verifyAuthProtection();
    const cookies = await verifyRoleProtection();
    await verifyGateAssignment(cookies);
    await verifyFuelLog(cookies);
    await verifyConsistentErrorFormat();

    console.log("\n═══════════════════════════════════════════════");
    console.log(`  Results: ${passed} passed, ${failed} failed`);
    console.log("═══════════════════════════════════════════════\n");

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n💥 Verification crashed:", error.message);
    process.exit(1);
  }
};

run();
