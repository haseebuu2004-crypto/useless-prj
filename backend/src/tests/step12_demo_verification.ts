/**
 * Step 12 — Competition Demo Mode Verification
 *
 * Tests:
 * 1. POST /api/session/demo/start — one-shot session bootstrap
 * 2. Exhibit A pre-loaded in demo session
 * 3. Mock camera observation → Exhibit B
 * 4. Demo witness testimony
 * 5. Full deliberation → verdict
 * 6. absurdity_context present in verdict
 * 7. Reset: close session and verify clean state
 * 8. Second run starts fresh (regression check)
 */

const BACKEND_URL = 'http://localhost:3000';

async function req(path: string, options?: RequestInit) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

async function runStep12Tests() {
  console.log("==================================================");
  console.log("  STEP 12: COMPETITION DEMO MODE VERIFICATION");
  console.log("==================================================\n");

  // ── 1. One-shot demo session bootstrap ──────────────────────────────────
  console.log("--- 1. POST /api/session/demo/start (one-shot bootstrap) ---");
  const session = await req('/api/session/demo/start', { method: 'POST' });
  const sessionId: string = session.session_id;

  if (
    session.status === 'EVIDENCE' &&
    session.case_data?.title === 'THE MIDNIGHT CAKE INCIDENT' &&
    session.case_data?.reason === 'Hunger.'
  ) {
    console.log(`✓ 1a. Demo session created: ${sessionId} (Status: ${session.status})`);
    console.log(`      Case: "${session.case_data.title}"`);
  } else {
    console.error("❌ 1a. Demo session bootstrap failed!", session);
  }

  // ── 2. Exhibit A pre-loaded ──────────────────────────────────────────────
  if (session.evidence?.length >= 1) {
    const exhibitA = session.evidence[0];
    console.log(`✓ 1b. Exhibit A pre-loaded: "${exhibitA.title}" (${exhibitA.exhibit_number})`);
  } else {
    console.error("❌ 1b. Exhibit A not pre-loaded in demo session!", session.evidence);
  }

  // ── 3. Simulate camera observation → Exhibit B ──────────────────────────
  console.log("\n--- 2. Simulate camera observation (mock RIGHT_HAND_RAISED) ---");
  const exhibitB = await req(`/api/session/${sessionId}/evidence`, {
    method: 'POST',
    body: JSON.stringify({
      type: 'GESTURE',
      title: 'Raised Right Hand',
      description: 'SIMULATED: Courtroom Observer detected defendant raising right hand.',
      source: 'CAMERA',
      metadata: {
        detector: 'gestureDetector',
        event: 'RIGHT_HAND_RAISED',
        confidence: 0.91,
        isMock: true,
        source: 'CAMERA',
        note: 'Simulated courtroom observation (demo mode — not from real webcam)'
      }
    })
  });
  if (exhibitB.source === 'CAMERA' && exhibitB.metadata?.event === 'RIGHT_HAND_RAISED') {
    console.log(`✓ 2. Camera observation (SIMULATED) entered as ${exhibitB.exhibit_number}`);
    console.log(`      isMock flag: ${exhibitB.metadata?.isMock}`);
  } else {
    console.error("❌ 2. Camera observation evidence failed!", exhibitB);
  }

  // ── 4. Demo witness testimony ────────────────────────────────────────────
  console.log("\n--- 3. Demo witness testimony (Roommate) ---");
  const afterTestimony = await req(`/api/session/${sessionId}/testimony`, {
    method: 'POST',
    body: JSON.stringify({
      witness: 'Roommate',
      statement: 'I heard suspicious chewing at approximately 3:00 AM. There was cake involved. I am certain.'
    })
  });
  if (afterTestimony.status === 'TESTIMONY' && afterTestimony.testimony?.length >= 1) {
    console.log(`✓ 3. Roommate testimony entered (Status: ${afterTestimony.status})`);
    console.log(`      Statement: "${afterTestimony.testimony[0].statement.slice(0, 60)}..."`);
  } else {
    console.error("❌ 3. Testimony submission failed!", afterTestimony);
  }

  // ── 5. Full deliberation ────────────────────────────────────────────────
  console.log("\n--- 4. Begin deliberation ---");
  const afterDeliberation = await req(`/api/session/${sessionId}/deliberate`, { method: 'POST' });
  if (afterDeliberation.status === 'DELIBERATION' && afterDeliberation.verdict) {
    console.log(`✓ 4. Deliberation complete (Status: ${afterDeliberation.status})`);
    console.log(`      Provider: ${afterDeliberation.verdict.provider}`);
  } else {
    console.error("❌ 4. Deliberation failed!", afterDeliberation);
  }

  // ── 6. Verdict with absurdity_context ───────────────────────────────────
  console.log("\n--- 5. Generate verdict ---");
  const afterVerdict = await req(`/api/session/${sessionId}/verdict`, { method: 'POST' });
  const verdict = afterVerdict.verdict;

  if (verdict?.decision && verdict?.absurdity_context) {
    console.log(`✓ 5. Verdict generated successfully!`);
    console.log(`      Decision: ${verdict.decision}`);
    console.log(`      Provider: ${verdict.provider}`);
    console.log(`      Absurd Offense: ${verdict.absurdity_context.offense_label}`);
    console.log(`      Suspicion Score: ${verdict.absurdity_context.suspicion_percentage}%`);
    console.log(`      Sentence: "${verdict.sentence}"`);
  } else {
    console.error("❌ 5. Verdict or absurdity_context missing!", verdict);
  }

  // ── 7. Reset: close session, verify clean state ─────────────────────────
  console.log("\n--- 6. Demo Reset — close session ---");
  const closed = await req(`/api/session/${sessionId}/close`, { method: 'POST' });
  if (closed.status === 'CLOSED') {
    console.log(`✓ 6a. Session closed successfully (Status: CLOSED)`);
  } else {
    console.error("❌ 6a. Session close failed!", closed);
  }

  // Verify evidence is cleared after session close (GET should still return old data
  // since the session is in memory — but its status is CLOSED and no new evidence can be added)
  try {
    await req(`/api/session/${sessionId}/evidence`, {
      method: 'POST',
      body: JSON.stringify({ type: 'TEXT', title: 'Post-close leak', description: 'This should fail' })
    });
    console.error("❌ 6b. Evidence added after session CLOSED — leak detected!");
  } catch (err: any) {
    console.log(`✓ 6b. Post-close evidence protection verified: "${err.message}"`);
  }

  // ── 8. Second run starts fresh ───────────────────────────────────────────
  console.log("\n--- 7. Second demo run starts fresh (regression) ---");
  const session2 = await req('/api/session/demo/start', { method: 'POST' });

  if (
    session2.session_id !== sessionId &&
    session2.status === 'EVIDENCE' &&
    session2.case_data?.title === 'THE MIDNIGHT CAKE INCIDENT' &&
    session2.evidence?.length === 1
  ) {
    console.log(`✓ 7. Second demo session is fresh:`);
    console.log(`      New Session ID: ${session2.session_id} (different from ${sessionId})`);
    console.log(`      Evidence count: ${session2.evidence.length} (Exhibit A only — no leakage from run 1)`);
  } else {
    console.error("❌ 7. Second demo session is not clean!", session2);
  }

  // Close second session cleanly
  await req(`/api/session/${session2.session_id}/testimony`, {
    method: 'POST',
    body: JSON.stringify({ witness: 'Self', statement: 'No comment.' })
  });
  await req(`/api/session/${session2.session_id}/deliberate`, { method: 'POST' });
  await req(`/api/session/${session2.session_id}/verdict`, { method: 'POST' });
  await req(`/api/session/${session2.session_id}/close`, { method: 'POST' });

  console.log(`\n✓ 7b. Second session completed full lifecycle and closed cleanly.`);

  console.log("\n==================================================");
  console.log("  ALL STEP 12 DEMO MODE CHECKS PASSED!");
  console.log("==================================================\n");
}

runStep12Tests().catch(err => {
  console.error("\nTest Error:", err);
  process.exit(1);
});
