import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { NextRequest, NextResponse } from "next/server.js";

function load(path, dependencies) {
  const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, URL, process,
    require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  }, { filename: path });
  return exports;
}

function proxyWith(user) {
  let calls = 0;
  const { proxy } = load("src/proxy.ts", {
    "next/server": { NextResponse },
    "@supabase/ssr": {
      createServerClient: (_url, _key, options) => ({
        auth: { getUser: async () => {
          calls++;
          options.cookies.setAll([{ name: "refreshed-session", value: "new", options: { httpOnly: true } }]);
          return { data: { user } };
        } },
      }),
    },
  });
  return { proxy, calls: () => calls };
}

test("미인증 OAuth 콜백은 인증 조회 전에 통과한다", async () => {
  const subject = proxyWith(null);
  const response = await subject.proxy(new NextRequest("https://sales.example/auth/callback?code=one-time"));
  assert.equal(subject.calls(), 0);
  assert.equal(response.headers.get("location"), null);
});

for (const [user, path, destination] of [
  [null, "/dashboard", "/login"],
  [{ id: "father" }, "/login", "/dashboard"],
]) {
  test(`${path} 리다이렉트에서도 갱신된 세션 쿠키를 보존한다 (${destination})`, async () => {
    const { proxy } = proxyWith(user);
    const response = await proxy(new NextRequest(`https://sales.example${path}`));
    assert.equal(response.headers.get("location"), `https://sales.example${destination}`);
    assert.equal(response.cookies.get("refreshed-session").value, "new");
  });
}

for (const outcome of ["success", "error", "throw", "missing", "denied"]) {
  test(`OAuth 콜백 ${outcome}: 안전한 복귀와 캐시 방지`, async () => {
    let exchanged = 0;
    const { GET } = load("src/app/auth/callback/route.ts", {
      "next/server": { NextResponse },
      "@/lib/supabase/server": { createClient: async () => ({ auth: {
        exchangeCodeForSession: async (code) => {
          exchanged++;
          assert.equal(code, "one-time");
          if (outcome === "throw") throw new Error("network");
          return { error: outcome === "error" ? new Error("invalid") : null };
        },
      } }) },
    });
    const query = outcome === "missing" ? "" : outcome === "denied" ? "?code=one-time&error=access_denied" : "?code=one-time&next=https://evil.example";
    const response = await GET(new Request(`https://sales.example/auth/callback${query}`));
    assert.equal(response.headers.get("location"), `https://sales.example${outcome === "success" ? "/dashboard" : "/login?error=auth"}`);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(exchanged, ["missing", "denied"].includes(outcome) ? 0 : 1);
  });
}

test("Google 요청은 같은 사이트의 콜백을 사용하고 시작 실패를 전달한다", async () => {
  let options;
  let failure = false;
  const { signInWithGoogle } = load("src/lib/supabase/queries.ts", {
    "./client": { createClient: () => ({ auth: { signInWithOAuth: async (value) => {
      options = value;
      return failure ? { error: new Error("disabled"), data: {} } : { error: null, data: { url: "https://auth.example" } };
    } } }) },
  });
  await signInWithGoogle("https://sales.example");
  assert.equal(options.provider, "google");
  assert.equal(options.options.redirectTo, "https://sales.example/auth/callback");
  failure = true;
  await assert.rejects(signInWithGoogle("https://sales.example"), /disabled/);
});

