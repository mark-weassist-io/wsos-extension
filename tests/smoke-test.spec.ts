import { test, expect } from "bun:test"

const BASE = "http://localhost:3000"

async function fetchHtml(url: string): Promise<string> {
  const r = await fetch(url)
  expect(r.status).toBe(200)
  return r.text()
}

test("GET / — Dashboard loads with metrics", async () => {
  const html = await fetchHtml(`${BASE}/`)
  expect(html).toContain("WSOS Ext")
  expect(html).toContain("Total OPs")
  expect(html).toContain("Active OPs")
  expect(html).toContain("Clients")
  expect(html).toContain("Onboarding in Progress")
  expect(html).toContain("Status Distribution")
  expect(html).toContain("CS Workload")
  expect(html).toContain("Recent Onboarding Activity")
})

test("GET /ops — OP Directory loads with search", async () => {
  const html = await fetchHtml(`${BASE}/ops`)
  expect(html).toContain("OP Directory")
  expect(html).toContain("Search")

  // Test search
  const searchHtml = await fetchHtml(`${BASE}/ops?search=Race`)
  expect(searchHtml).toContain("Race Jay")
})

test("GET /clients — Clients list loads", async () => {
  const html = await fetchHtml(`${BASE}/clients`)
  expect(html).toContain("Clients")
})

test("GET /onboarding — Onboarding page loads with filters", async () => {
  const html = await fetchHtml(`${BASE}/onboarding`)
  expect(html).toContain("Onboarding")

  // Test person filter
  const michelleHtml = await fetchHtml(`${BASE}/onboarding?person=Michelle`)
  expect(michelleHtml).toContain("Michelle")

  const dennisHtml = await fetchHtml(`${BASE}/onboarding?person=Dennis`)
  expect(dennisHtml).toContain("Dennis")
})

test("GET /onboarding/:name — Onboarding detail loads", async () => {
  const html = await fetchHtml(`${BASE}/onboarding/Charisse%20Pineda`)
  expect(html).toContain("Onboarding Steps")
  expect(html).toContain("Charisse Pineda")
})

test("GET /checkins — Check-ins loads", async () => {
  const html = await fetchHtml(`${BASE}/checkins`)
  expect(html).toContain("90-Day Check-ins")
})

test("GET /schedule — Schedule loads with filters", async () => {
  const html = await fetchHtml(`${BASE}/schedule`)
  expect(html).toContain("Check-in Schedule")

  const upcomingHtml = await fetchHtml(`${BASE}/schedule?filter=upcoming`)
  expect(upcomingHtml).toContain("Upcoming")

  const overdueHtml = await fetchHtml(`${BASE}/schedule?filter=overdue`)
  expect(overdueHtml).toContain("Overdue")
})

test("GET /red-flags — Red flags loads", async () => {
  const html = await fetchHtml(`${BASE}/red-flags`)
  expect(html).toContain("Red Flags")
  expect(html).toContain("Communication Issues")
})

test("GET /existing-accounts — Existing accounts loads", async () => {
  const html = await fetchHtml(`${BASE}/existing-accounts`)
  expect(html).toContain("Existing Accounts")
})

test("404 redirects to dashboard", async () => {
  const r = await fetch(`${BASE}/nonexistent`, { redirect: "manual" })
  expect(r.status).toBe(302)
})
