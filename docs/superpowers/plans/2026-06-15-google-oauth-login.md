# Google OAuth Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth login via Supabase, implemented entirely in the C# backend — no Supabase JS client on the frontend.

**Architecture:** Frontend calls `GET /api/auth/url` to get the Google OAuth redirect URL, user is sent to Google, Supabase redirects back to the frontend `/auth/callback` page with a `code` + `state` query param, the frontend POSTs those to `POST /api/auth/exchange`, and the backend returns a signed JWT. The JWT is stored in `localStorage` and sent as a `Bearer` header on all subsequent API calls. Backend controllers enforce auth via a `[RequireAuth]` filter that skips GET/OPTIONS.

**Tech Stack:** C# ASP.NET Core 9, `System.IdentityModel.Tokens.Jwt` (new NuGet), Vue 3 + Pinia, Supabase Auth (Google OAuth provider)

---

## Prerequisites (manual steps before coding)

1. In **Supabase Dashboard → Authentication → Providers → Google**: enable Google provider, paste Google OAuth Client ID and Client Secret (from Google Cloud Console).
2. In **Google Cloud Console → APIs & Services → Credentials**: add `https://<your-supabase-project>.supabase.co/auth/v1/callback` as an authorized redirect URI.
3. In **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**: add `http://localhost:5173/auth/callback` (and production URL when deploying).

---

## File Map

**Backend (`D:\RiderProject\hiking-backend`)**

| Action | File | Purpose |
|--------|------|---------|
| Create | `hiking.Service/Options/AuthOptions.cs` | `JwtSecret`, `FrontendUrl` config |
| Modify | `hiking.WebApi/appsettings.json` | Add `Auth` section skeleton |
| Modify | `hiking.WebApi/appsettings.Development.json` | Fill dev values |
| Modify | `hiking.WebApi/hiking.WebApi.csproj` | Add JWT NuGet package |
| Create | `hiking.Service/Services/AuthService.cs` | PKCE generation, Supabase token exchange, JWT sign/validate |
| Create | `hiking.WebApi/Controllers/AuthController.cs` | `GET /url`, `POST /exchange`, `GET /me` |
| Create | `hiking.WebApi/RequestModel/RequireAuthAttribute.cs` | Action filter attribute |
| Modify | `hiking.WebApi/Program.cs` | Register `AuthOptions`, `AuthService` |
| Modify | `hiking.WebApi/Controllers/PostConroller.cs` | Add `[RequireAuth]` at class level |
| Modify | `hiking.WebApi/Controllers/PhotoController.cs` | Add `[RequireAuth]` at class level |
| Modify | `hiking.WebApi/Controllers/GearController.cs` | Add `[RequireAuth]` at class level |
| Modify | `hiking.WebApi/Controllers/GpxController.cs` | Add `[RequireAuth]` at class level |
| Modify | `hiking.WebApi/Controllers/GpxLibraryController.cs` | Add `[RequireAuth]` at class level |
| Modify | `hiking.WebApi/Controllers/TagController.cs` | Add `[RequireAuth]` at class level |

**Frontend (`D:\Project\Personal\hiking\src`)**

| Action | File | Purpose |
|--------|------|---------|
| Create | `stores/authStore.ts` | Auth state, `init`, `login`, `handleCallback`, `logout` |
| Modify | `stores/postStore.ts` | Inject Bearer token header in `apiFetch` |
| Create | `pages/AuthCallback.vue` | Reads `code`+`state` from URL, calls `handleCallback`, redirects |
| Modify | `App.vue` | Call `authStore.init()` on mount |
| Modify | `pages/Home.vue` | Login button / avatar dropdown in navbar |
| Modify | `router/index.ts` | Add `/auth/callback` route + beforeEach guard for `/create`, `/edit/:id` |

---

## Task 1: Backend — `AuthOptions` and appsettings

**Files:**
- Create: `hiking.Service/Options/AuthOptions.cs`
- Modify: `hiking.WebApi/appsettings.json`
- Modify: `hiking.WebApi/appsettings.Development.json`

- [ ] **Step 1: Create `AuthOptions.cs`**

`D:\RiderProject\hiking-backend\hiking.Service\Options\AuthOptions.cs`:
```csharp
namespace hikingService.Options;

public class AuthOptions
{
    public string JwtSecret   { get; set; } = "";
    public string FrontendUrl { get; set; } = "";
}
```

- [ ] **Step 2: Add `Auth` skeleton to `appsettings.json`**

In `D:\RiderProject\hiking-backend\hiking.WebApi\appsettings.json`, add inside the root JSON object:
```json
"Auth": {
  "JwtSecret": "",
  "FrontendUrl": ""
}
```

- [ ] **Step 3: Fill dev values in `appsettings.Development.json`**

In `D:\RiderProject\hiking-backend\hiking.WebApi\appsettings.Development.json`, add inside the root JSON object:
```json
"Auth": {
  "JwtSecret": "dev-secret-change-in-production-must-be-32-chars!",
  "FrontendUrl": "http://localhost:5173"
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/RiderProject/hiking-backend
git add hiking.Service/Options/AuthOptions.cs hiking.WebApi/appsettings.json hiking.WebApi/appsettings.Development.json
git commit -m "feat: add AuthOptions config for JWT secret and frontend URL"
```

---

## Task 2: Backend — Add JWT NuGet package

**Files:**
- Modify: `hiking.WebApi/hiking.WebApi.csproj`

- [ ] **Step 1: Add the package**

```bash
cd D:/RiderProject/hiking-backend/hiking.WebApi
dotnet add package System.IdentityModel.Tokens.Jwt --version 8.3.2
```

Expected output: `PackageReference ... System.IdentityModel.Tokens.Jwt ... 8.3.2` added to `.csproj`.

- [ ] **Step 2: Verify it builds**

```bash
cd D:/RiderProject/hiking-backend
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add hiking.WebApi/hiking.WebApi.csproj
git commit -m "chore: add System.IdentityModel.Tokens.Jwt for auth JWT signing"
```

---

## Task 3: Backend — `AuthService`

**Files:**
- Create: `hiking.Service/Services/AuthService.cs`

- [ ] **Step 1: Create `AuthService.cs`**

`D:\RiderProject\hiking-backend\hiking.Service\Services\AuthService.cs`:
```csharp
using System;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using hikingService.Options;
using Microsoft.IdentityModel.Tokens;

namespace hikingService.Services;

public record AuthUser(string Email, string Name, string AvatarUrl);

public class AuthService(HttpClient http, SupabaseOptions supabaseOpts, AuthOptions authOpts)
{
    private static readonly ConcurrentDictionary<string, (string Verifier, DateTime Expiry)> PkceStore = new();

    public (string Url, string State) BuildOAuthUrl()
    {
        var verifier  = GenerateCodeVerifier();
        var challenge = GenerateCodeChallenge(verifier);
        var state     = Convert.ToHexString(RandomNumberGenerator.GetBytes(16));

        PkceStore[state] = (verifier, DateTime.UtcNow.AddMinutes(10));
        CleanupExpired();

        var redirectTo = Uri.EscapeDataString($"{authOpts.FrontendUrl}/auth/callback");
        var url = $"{supabaseOpts.Url}/auth/v1/authorize?provider=google" +
                  $"&redirect_to={redirectTo}" +
                  $"&code_challenge={challenge}" +
                  $"&code_challenge_method=S256" +
                  $"&state={state}";

        return (url, state);
    }

    public async Task<AuthUser?> ExchangeCodeAsync(string code, string state)
    {
        if (!PkceStore.TryRemove(state, out var entry) || entry.Expiry < DateTime.UtcNow)
            return null;

        var req = new HttpRequestMessage(HttpMethod.Post, $"{supabaseOpts.Url}/auth/v1/token?grant_type=pkce");
        req.Headers.Add("apikey", supabaseOpts.ServiceKey);
        req.Content = JsonContent.Create(new { auth_code = code, code_verifier = entry.Verifier });

        var res = await http.SendAsync(req);
        if (!res.IsSuccessStatusCode) return null;

        var json = await res.Content.ReadFromJsonAsync<JsonElement>();
        var user = json.GetProperty("user");
        var meta = user.GetProperty("user_metadata");

        return new AuthUser(
            Email    : user.GetProperty("email").GetString() ?? "",
            Name     : meta.TryGetProperty("full_name",  out var n) ? n.GetString() ?? "" : "",
            AvatarUrl: meta.TryGetProperty("avatar_url", out var a) ? a.GetString() ?? "" : ""
        );
    }

    public string CreateJwt(AuthUser user)
    {
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOpts.JwtSecret));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token  = new JwtSecurityToken(
            claims: [
                new Claim("email",     user.Email),
                new Claim("name",      user.Name),
                new Claim("avatarUrl", user.AvatarUrl),
            ],
            expires            : DateTime.UtcNow.AddDays(30),
            signingCredentials : creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public AuthUser? ValidateJwt(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(authOpts.JwtSecret));
        try
        {
            handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey         = key,
                ValidateIssuer           = false,
                ValidateAudience         = false,
                ClockSkew                = TimeSpan.Zero,
            }, out var validated);

            var jwt = (JwtSecurityToken)validated;
            return new AuthUser(
                Email    : jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value     ?? "",
                Name     : jwt.Claims.FirstOrDefault(c => c.Type == "name")?.Value      ?? "",
                AvatarUrl: jwt.Claims.FirstOrDefault(c => c.Type == "avatarUrl")?.Value ?? ""
            );
        }
        catch { return null; }
    }

    private static string GenerateCodeVerifier()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static string GenerateCodeChallenge(string verifier)
    {
        var bytes = SHA256.HashData(Encoding.ASCII.GetBytes(verifier));
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static void CleanupExpired()
    {
        var now = DateTime.UtcNow;
        foreach (var k in PkceStore.Keys)
            if (PkceStore.TryGetValue(k, out var v) && v.Expiry < now)
                PkceStore.TryRemove(k, out _);
    }
}
```

- [ ] **Step 2: Verify build**

```bash
cd D:/RiderProject/hiking-backend
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add hiking.Service/Services/AuthService.cs
git commit -m "feat: AuthService with PKCE generation, Supabase token exchange, and JWT sign/validate"
```

---

## Task 4: Backend — `AuthController`

**Files:**
- Create: `hiking.WebApi/Controllers/AuthController.cs`

- [ ] **Step 1: Create `AuthController.cs`**

`D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\AuthController.cs`:
```csharp
using System.Linq;
using System.Threading.Tasks;
using hikingService.Services;
using Microsoft.AspNetCore.Mvc;

namespace hiking_controller.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService authSvc) : ControllerBase
{
    [HttpGet("url")]
    public IActionResult GetOAuthUrl()
    {
        var (url, state) = authSvc.BuildOAuthUrl();
        return Ok(new { url, state });
    }

    public record ExchangeRequest(string Code, string State);

    [HttpPost("exchange")]
    public async Task<IActionResult> Exchange([FromBody] ExchangeRequest req)
    {
        var user = await authSvc.ExchangeCodeAsync(req.Code, req.State);
        if (user is null) return Unauthorized();
        var token = authSvc.CreateJwt(user);
        return Ok(new { token, user.Email, user.Name, user.AvatarUrl });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        var bearer = Request.Headers.Authorization.FirstOrDefault();
        var token  = bearer?.StartsWith("Bearer ") == true ? bearer[7..] : null;
        if (token is null) return Unauthorized();
        var user = authSvc.ValidateJwt(token);
        if (user is null) return Unauthorized();
        return Ok(new { user.Email, user.Name, user.AvatarUrl });
    }
}
```

- [ ] **Step 2: Verify build**

```bash
cd D:/RiderProject/hiking-backend
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 3: Commit**

```bash
git add hiking.WebApi/Controllers/AuthController.cs
git commit -m "feat: AuthController with /url, /exchange, /me endpoints"
```

---

## Task 5: Backend — `RequireAuthAttribute` and protect controllers

**Files:**
- Create: `hiking.WebApi/RequestModel/RequireAuthAttribute.cs`
- Modify: `hiking.WebApi/Controllers/PostConroller.cs`
- Modify: `hiking.WebApi/Controllers/PhotoController.cs`
- Modify: `hiking.WebApi/Controllers/GearController.cs`
- Modify: `hiking.WebApi/Controllers/GpxController.cs`
- Modify: `hiking.WebApi/Controllers/GpxLibraryController.cs`
- Modify: `hiking.WebApi/Controllers/TagController.cs`

- [ ] **Step 1: Create `RequireAuthAttribute.cs`**

`D:\RiderProject\hiking-backend\hiking.WebApi\RequestModel\RequireAuthAttribute.cs`:
```csharp
using System;
using System.Linq;
using hikingService.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.DependencyInjection;

namespace hiking_controller.RequestModel;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class RequireAuthAttribute : Attribute, IFilterFactory
{
    public bool IsReusable => false;

    public IFilterMetadata CreateInstance(IServiceProvider sp) =>
        new RequireAuthFilter(sp.GetRequiredService<AuthService>());
}

public class RequireAuthFilter(AuthService authSvc) : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext ctx)
    {
        var method = ctx.HttpContext.Request.Method;
        if (HttpMethods.IsGet(method) || HttpMethods.IsOptions(method)) return;

        var bearer = ctx.HttpContext.Request.Headers.Authorization.FirstOrDefault();
        var token  = bearer?.StartsWith("Bearer ") == true ? bearer[7..] : null;

        if (token is null || authSvc.ValidateJwt(token) is null)
            ctx.Result = new UnauthorizedObjectResult(new { error = "Authentication required" });
    }

    public void OnActionExecuted(ActionExecutedContext ctx) { }
}
```

- [ ] **Step 2: Add `[RequireAuth]` to data controllers**

In each of the following files, add `using hiking_controller.RequestModel;` to the using statements and `[RequireAuth]` directly above the class declaration (below existing `[ApiController]` and `[Route]` attributes):

- `D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\PostConroller.cs`
- `D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\PhotoController.cs`
- `D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\GearController.cs`
- `D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\GpxController.cs`
- `D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\GpxLibraryController.cs`
- `D:\RiderProject\hiking-backend\hiking.WebApi\Controllers\TagController.cs`

Example diff for `PostConroller.cs`:
```csharp
// Add to usings:
using hiking_controller.RequestModel;

// Add attribute before class:
[ApiController]
[Route("api/[controller]")]
[RequireAuth]                    // ← add this line
public class PostsController(...) : ControllerBase
```

- [ ] **Step 3: Verify build**

```bash
cd D:/RiderProject/hiking-backend
dotnet build
```

Expected: `Build succeeded.`

- [ ] **Step 4: Commit**

```bash
git add hiking.WebApi/RequestModel/RequireAuthAttribute.cs \
        hiking.WebApi/Controllers/PostConroller.cs \
        hiking.WebApi/Controllers/PhotoController.cs \
        hiking.WebApi/Controllers/GearController.cs \
        hiking.WebApi/Controllers/GpxController.cs \
        hiking.WebApi/Controllers/GpxLibraryController.cs \
        hiking.WebApi/Controllers/TagController.cs
git commit -m "feat: RequireAuthFilter and protect all mutating API endpoints"
```

---

## Task 6: Backend — Register services in `Program.cs`

**Files:**
- Modify: `hiking.WebApi/Program.cs`

- [ ] **Step 1: Add `AuthOptions` binding and `AuthService` registration**

In `D:\RiderProject\hiking-backend\hiking.WebApi\Program.cs`, add after the existing `supabaseOptions` singleton registration (around line 37):

```csharp
var authOptions = builder.Configuration.GetSection("Auth").Get<AuthOptions>()!;
builder.Services.AddSingleton(authOptions);
builder.Services.AddHttpClient<AuthService>();
```

Also add the using if needed at the top:
```csharp
using hikingService.Options;
```

- [ ] **Step 2: Verify build and run**

```bash
cd D:/RiderProject/hiking-backend
dotnet build
dotnet run --project hiking.WebApi
```

Expected: server starts on `http://localhost:5253`. Visit `http://localhost:5253/api/auth/url` in a browser and confirm you get a JSON response with `url` and `state` fields.

- [ ] **Step 3: Commit**

```bash
git add hiking.WebApi/Program.cs
git commit -m "feat: register AuthOptions and AuthService in DI"
```

---

## Task 7: Frontend — `authStore.ts`

**Files:**
- Create: `src/stores/authStore.ts`

- [ ] **Step 1: Create `authStore.ts`**

`D:\Project\Personal\hiking\src\stores\authStore.ts`:
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_BASE    = import.meta.env.VITE_API_URL ?? ''
const STORAGE_KEY = 'hiking_auth'

export interface AuthUser {
  email:     string
  name:      string
  avatarUrl: string
}

export const useAuthStore = defineStore('auth', () => {
  const user  = ref<AuthUser | null>(null)
  const token = ref<string | null>(null)

  function init() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { token: string; user: AuthUser }
      token.value = parsed.token
      user.value  = parsed.user
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  async function login() {
    const res  = await fetch(`${API_BASE}/api/auth/url`)
    const data = await res.json() as { url: string; state: string }
    sessionStorage.setItem('oauth_state', data.state)
    window.location.href = data.url
  }

  async function handleCallback(code: string, state: string) {
    const expected = sessionStorage.getItem('oauth_state')
    if (state !== expected) throw new Error('Invalid state — possible CSRF')
    sessionStorage.removeItem('oauth_state')

    const res = await fetch(`${API_BASE}/api/auth/exchange`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code, state }),
    })
    if (!res.ok) throw new Error(`Exchange failed: ${await res.text()}`)

    const data = await res.json() as { token: string; email: string; name: string; avatarUrl: string }
    token.value = data.token
    user.value  = { email: data.email, name: data.name, avatarUrl: data.avatarUrl }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token, user: user.value }))
  }

  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem('oauth_state')
  }

  return { user, token, init, login, handleCallback, logout }
})
```

- [ ] **Step 2: Commit**

```bash
cd D:/Project/Personal/hiking
git add src/stores/authStore.ts
git commit -m "feat: authStore with init, login, handleCallback, logout"
```

---

## Task 8: Frontend — `postStore.ts` Bearer header

**Files:**
- Modify: `src/stores/postStore.ts`

- [ ] **Step 1: Update `apiFetch` to inject Bearer token**

In `D:\Project\Personal\hiking\src\stores\postStore.ts`, replace the existing `apiFetch` function:

```typescript
// Add import at the top of the file (after existing imports):
import { useAuthStore } from './authStore'

// Replace the apiFetch function:
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const auth    = useAuthStore()
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> ?? {}) }
  if (auth.token) headers['Authorization'] = `Bearer ${auth.token}`
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) throw new Error(await res.text())
  return res
}
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/postStore.ts
git commit -m "feat: inject Authorization Bearer token into all API requests"
```

---

## Task 9: Frontend — `AuthCallback.vue` page and route

**Files:**
- Create: `src/pages/AuthCallback.vue`
- Modify: `src/router/index.ts`

- [ ] **Step 1: Create `AuthCallback.vue`**

`D:\Project\Personal\hiking\src\pages\AuthCallback.vue`:
```vue
<template>
  <div class="min-h-screen textured-bg vignette flex items-center justify-center">
    <div class="card-aged px-10 py-8 text-center max-w-sm">
      <p v-if="error" class="font-body text-sm" style="color: #f87171;">登入失敗：{{ error }}</p>
      <p v-else class="font-body text-sm text-inkMuted">登入中，請稍候…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const error  = ref<string | null>(null)

onMounted(async () => {
  const code  = route.query.code  as string | undefined
  const state = route.query.state as string | undefined
  if (!code || !state) {
    error.value = '缺少授權參數'
    return
  }
  try {
    await auth.handleCallback(code, state)
    router.replace('/')
  } catch (e) {
    error.value = (e as Error).message
  }
})
</script>
```

- [ ] **Step 2: Add the route to `router/index.ts`**

In `D:\Project\Personal\hiking\src\router\index.ts`, add the import and route:

```typescript
import AuthCallback from '../pages/AuthCallback.vue'

// Inside the routes array, add:
{ path: '/auth/callback', component: AuthCallback },
```

- [ ] **Step 3: Add route guards for `/create` and `/edit/:id`**

In `D:\Project\Personal\hiking\src\router\index.ts`, after `export default router`, add:

```typescript
import { useAuthStore } from '../stores/authStore'

router.beforeEach((to) => {
  if (to.path === '/create' || to.path.startsWith('/edit/')) {
    const auth = useAuthStore()
    if (!auth.user) return '/'
  }
})
```

The full updated `router/index.ts`:
```typescript
import { createRouter, createWebHistory } from 'vue-router'
import Home         from '../pages/Home.vue'
import Detail       from '../pages/Detail.vue'
import Create       from '../pages/Create.vue'
import Edit         from '../pages/Edit.vue'
import GpxLibrary   from '../pages/GpxLibrary.vue'
import GearLibrary  from '../pages/GearLibrary.vue'
import AuthCallback from '../pages/AuthCallback.vue'
import { useAuthStore } from '../stores/authStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',              component: Home },
    { path: '/detail/:id',   component: Detail },
    { path: '/create',       component: Create },
    { path: '/edit/:id',     component: Edit },
    { path: '/gpx-library',  component: GpxLibrary },
    { path: '/gear-library', component: GearLibrary },
    { path: '/auth/callback', component: AuthCallback },
  ],
})

router.beforeEach((to) => {
  if (to.path === '/create' || to.path.startsWith('/edit/')) {
    const auth = useAuthStore()
    if (!auth.user) return '/'
  }
})

export default router
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/AuthCallback.vue src/router/index.ts
git commit -m "feat: AuthCallback page and router guard for protected routes"
```

---

## Task 10: Frontend — `App.vue` init on mount

**Files:**
- Modify: `src/App.vue`

- [ ] **Step 1: Call `authStore.init()` in `App.vue`**

Replace `D:\Project\Personal\hiking\src\App.vue` script section (currently has none) with:

```vue
<template>
  <img
    class="topo-bg"
    :src="bg"
    alt=""
    aria-hidden="true"
  />
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import bg1 from './assets/typography-bg.svg'
import bg2 from './assets/typography-bg-2.svg'
import bg3 from './assets/typography-bg-3.svg'
import bg4 from './assets/typography-bg-4.svg'
import bg5 from './assets/typography-bg-5.svg'
import { useAuthStore } from './stores/authStore'

const BACKGROUNDS = [bg1, bg2, bg3, bg4, bg5]
const bg = BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)]

const auth = useAuthStore()
onMounted(() => auth.init())
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/App.vue
git commit -m "feat: restore auth session from localStorage on app mount"
```

---

## Task 11: Frontend — Navbar login button and avatar in `Home.vue`

**Files:**
- Modify: `src/pages/Home.vue`

- [ ] **Step 1: Add auth imports to `Home.vue` script**

In `D:\Project\Personal\hiking\src\pages\Home.vue`, inside the `<script setup lang="ts">` block, add:

```typescript
import { LogIn as LogInIcon, LogOut as LogOutIcon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/authStore'

const auth = useAuthStore()
const showUserMenu = ref(false)
```

Also add `LogIn as LogInIcon, LogOut as LogOutIcon` to the existing lucide-vue-next import line (merge with existing), or add as a separate import.

- [ ] **Step 2: Update the navbar buttons section**

In `D:\Project\Personal\hiking\src\pages\Home.vue`, replace the `<div class="flex items-center gap-2">` navbar block with:

```html
<div class="flex items-center gap-2">
  <button
    class="card-aged w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
    @click="theme.toggle()"
    :aria-label="theme.isDark ? '切換亮色模式' : '切換暗色模式'"
  >
    <SunIcon v-if="theme.isDark" :size="17" />
    <MoonIcon v-else :size="17" />
  </button>
  <router-link
    to="/gpx-library"
    class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
  >
    <RouteIcon :size="15" />
    GPX 收藏
  </router-link>
  <router-link
    to="/gear-library"
    class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
  >
    <LibraryIcon :size="15" />
    裝備庫
  </router-link>
  <router-link to="/create" class="btn-cta flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer">
    <PlusIcon :size="15" />
    新增記錄
  </router-link>

  <!-- Not logged in: show login button -->
  <button
    v-if="!auth.user"
    @click="auth.login()"
    class="card-aged flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold font-body cursor-pointer text-inkMuted hover:text-ink transition-colors duration-200"
  >
    <LogInIcon :size="15" />
    登入
  </button>

  <!-- Logged in: show avatar with dropdown -->
  <div v-else class="relative">
    <button
      @click="showUserMenu = !showUserMenu"
      class="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center cursor-pointer"
      style="background: var(--c-primary);"
    >
      <img
        v-if="auth.user.avatarUrl"
        :src="auth.user.avatarUrl"
        class="w-full h-full object-cover"
        alt="avatar"
      />
      <span v-else class="font-heading text-sm font-bold" style="color: var(--c-base);">
        {{ auth.user.name?.[0]?.toUpperCase() ?? '?' }}
      </span>
    </button>

    <div
      v-if="showUserMenu"
      class="absolute right-0 top-11 card-aged rounded-xl shadow-xl p-2 z-50"
      style="min-width: 10rem;"
    >
      <p class="text-xs font-body px-3 py-1 truncate text-inkMuted">{{ auth.user.email }}</p>
      <button
        @click="auth.logout(); showUserMenu = false"
        class="w-full text-left flex items-center gap-2 px-3 py-2 text-sm font-body rounded-lg text-inkMuted hover:text-ink transition-colors duration-200"
      >
        <LogOutIcon :size="13" />
        登出
      </button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/Home.vue
git commit -m "feat: navbar login button and user avatar with logout dropdown"
```

---

## Task 12: End-to-end verification

- [ ] **Step 1: Start backend**

```bash
cd D:/RiderProject/hiking-backend
dotnet run --project hiking.WebApi --launch-profile http
```

Expected: server running on `http://localhost:5253`.

- [ ] **Step 2: Start frontend**

```bash
cd D:/Project/Personal/hiking
npm run dev
```

Expected: Vite dev server on `http://localhost:5173`.

- [ ] **Step 3: Verify unauthenticated API blocks writes**

```bash
curl -X POST http://localhost:5253/api/Posts -H "Content-Type: application/json" -d '{}'
```

Expected: `401 Unauthorized`.

- [ ] **Step 4: Verify GET still works without auth**

```bash
curl http://localhost:5253/api/Posts
```

Expected: `200 OK` with posts array.

- [ ] **Step 5: Verify OAuth URL endpoint**

```bash
curl http://localhost:5253/api/auth/url
```

Expected: JSON with `url` (a `https://...supabase.co/auth/v1/authorize?provider=google...` URL) and `state` string.

- [ ] **Step 6: Full login flow in browser**

Open `http://localhost:5173`, click "登入", complete Google OAuth, confirm you land back on `/` with your avatar in the navbar.

- [ ] **Step 7: Verify protected page guard**

Log out. Navigate directly to `http://localhost:5173/create`. Confirm you're redirected to `/`.

- [ ] **Step 8: Verify create works after login**

Log in, navigate to `/create`, confirm the form loads and submitting creates a post.

---

## Notes

- **`JwtSecret` in production**: must be at least 32 characters. Set via environment variable `Auth__JwtSecret` (ASP.NET colon-key convention uses double-underscore for env vars).
- **`appsettings.Development.json` is gitignored** (contains Supabase keys) — team members need to fill it locally.
- The PKCE state store is in-memory — a server restart clears it. Any in-flight OAuth redirects will fail with "Invalid state" and the user just needs to log in again. This is acceptable for a personal app.
- **`[RequireAuth]` skips GET and OPTIONS** — read endpoints remain fully public. Supabase RLS also provides a second layer of protection at the database level.
