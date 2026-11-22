#!/usr/bin/env bash
# CBT Next.js App Router scaffold. Creates missing paths only.
# Usage: bash scaffold_cbt_routes.sh [project-directory]
set -Eeuo pipefail

PROJECT_DIR="${1:-.}"
if [[ ! -d "$PROJECT_DIR" ]]; then
  echo "Project directory not found: $PROJECT_DIR" >&2
  echo 'Usage: bash scaffold_cbt_routes.sh /path/to/cbt-app' >&2
  exit 1
fi
cd "$PROJECT_DIR"

# Works with either app/ or src/app/. Prefer the existing tree.
if [[ -d src/app ]]; then
  APP_DIR="src/app"
elif [[ -d app ]]; then
  APP_DIR="app"
else
  APP_DIR="app"
  mkdir -p "$APP_DIR"
fi

# Match aliases to the existing @/* convention (typically ./src/* or ./*).
if [[ "$APP_DIR" == src/app ]]; then
  BASE="src"
else
  BASE="."
fi
COMPONENT_DIR="$BASE/components/common"
FEATURE_DIR="$BASE/features/cbt"

created=0
kept=0
skipped=0

# Route groups are invisible in URLs. Normalize an App Router file path for
# collision detection across groups, e.g. (public)/help and (other)/help.
normalized_route() {
  local path="$1" segment out=""
  path="${path#"$APP_DIR"/}"
  case "$path" in
    page.tsx|page.jsx|page.ts|page.js|route.ts|route.js|route.tsx|route.jsx) path="" ;;
    *) path="${path%/page.tsx}"; path="${path%/page.jsx}"
       path="${path%/page.ts}"; path="${path%/page.js}"
       path="${path%/route.ts}"; path="${path%/route.js}"
       path="${path%/route.tsx}"; path="${path%/route.jsx}" ;;
  esac
  IFS='/' read -ra parts <<< "$path"
  for segment in "${parts[@]}"; do
    if [[ "$segment" == \(*\) ]]; then continue; fi
    out+="/$segment"
  done
  printf '%s' "${out:-/}"
}

# If another route group already owns the URL, don't generate a second page.
route_exists_elsewhere() {
  local target="$1" desired existing
  desired="$(normalized_route "$target")"
  while IFS= read -r -d '' existing; do
    [[ "$existing" == "$target" ]] && continue
    [[ "$(normalized_route "$existing")" == "$desired" ]] && return 0
  done < <(find "$APP_DIR" -type f \( -name 'page.tsx' -o -name 'page.jsx' -o -name 'page.ts' -o -name 'page.js' -o -name 'route.ts' -o -name 'route.js' \) -print0)
  return 1
}

write_if_missing() {
  local file="$1" content="$2"
  mkdir -p "$(dirname "$file")"
  if [[ -e "$file" ]]; then
    echo "Kept:    $file"
    ((kept+=1))
    return
  fi
  if [[ "$file" == "$APP_DIR"/* ]] && route_exists_elsewhere "$file"; then
    echo "Skipped: $file (same URL already defined elsewhere in app)"
    ((skipped+=1))
    return
  fi
  printf '%s\n' "$content" > "$file"
  echo "Created: $file"
  ((created+=1))
}

mkdir -p "$COMPONENT_DIR" \
  "$FEATURE_DIR/questions" "$FEATURE_DIR/exams" \
  "$FEATURE_DIR/candidates" "$FEATURE_DIR/attempts" \
  "$FEATURE_DIR/results" "$FEATURE_DIR/school"

write_if_missing "$COMPONENT_DIR/ComingSoon.tsx" 'type ComingSoonProps = {
  title: string;
  description?: string;
};

export default function ComingSoon({
  title,
  description = "This section is under development.",
}: ComingSoonProps) {
  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full border px-4 py-2 text-sm text-muted-foreground">
        Coming Soon
      </div>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-md text-muted-foreground">{description}</p>
    </main>
  );
}'

# Relative import avoids assuming the existing tsconfig @/* points to src or root.
create_page() {
  local file="$1" title="$2" desc="${3:-This section is under development.}"
  local page_dir relative
  page_dir="$(dirname "$file")"
  mkdir -p "$page_dir"
  relative="$(realpath --relative-to="$page_dir" "$COMPONENT_DIR/ComingSoon")"
  [[ "$relative" == .* ]] || relative="./$relative"
  write_if_missing "$file" "import ComingSoon from \"$relative\";

export default function Page() {
  return <ComingSoon title=\"$title\" description=\"$desc\" />;
}"
}

# Existing app/page.tsx is preserved; don't create conflicting (public)/page.tsx.
create_page "$APP_DIR/(public)/page.tsx" "CBT Home"
create_page "$APP_DIR/(public)/help/page.tsx" "Help"
create_page "$APP_DIR/(public)/help/candidates/page.tsx" "Candidate Instructions"
create_page "$APP_DIR/(public)/help/examiners/page.tsx" "Examiner Instructions"
create_page "$APP_DIR/(public)/exam/page.tsx" "Enter Examination Code"
create_page "$APP_DIR/(public)/exam/[code]/page.tsx" "Examination Entry"

create_page "$APP_DIR/(auth)/login/page.tsx" "Staff Login"
create_page "$APP_DIR/(auth)/register/page.tsx" "Organization Registration" "Organization registration will be added later."
create_page "$APP_DIR/(auth)/setup/page.tsx" "Organization Setup" "Organization setup will be added later."

# Security: do not accidentally expose staff pages before an auth guard exists.
# Replace this temporary fail-closed layout with the real session/org/permission
# gate when wiring the existing Supabase login.
write_if_missing "$APP_DIR/(staff)/layout.tsx" 'import { redirect } from "next/navigation";

export default function StaffLayout({
  children: _children,
}: Readonly<{ children: React.ReactNode }>) {
  // TODO: Replace with Supabase session + organization membership/permission check.
  // Intentionally deny access until that guard is implemented.
  redirect("/login");
}'
create_page "$APP_DIR/(staff)/dashboard/page.tsx" "CBT Dashboard"
create_page "$APP_DIR/(staff)/questions/page.tsx" "Question Bank"
create_page "$APP_DIR/(staff)/questions/new/page.tsx" "Create Question"
create_page "$APP_DIR/(staff)/questions/[id]/page.tsx" "Question Details"
create_page "$APP_DIR/(staff)/exams/page.tsx" "Examinations"
create_page "$APP_DIR/(staff)/exams/new/page.tsx" "Create Examination"
create_page "$APP_DIR/(staff)/exams/[id]/page.tsx" "Examination Workspace"
create_page "$APP_DIR/(staff)/candidates/page.tsx" "Candidates"
create_page "$APP_DIR/(staff)/candidates/[id]/page.tsx" "Candidate Details"
create_page "$APP_DIR/(staff)/results/page.tsx" "Examination Results"
create_page "$APP_DIR/(staff)/settings/page.tsx" "Organization Settings"
create_page "$APP_DIR/(staff)/school/page.tsx" "School Integration" "Only available to authorized school organizations."

create_page "$APP_DIR/(candidate)/my-exams/page.tsx" "My Examinations"
create_page "$APP_DIR/(candidate)/my-results/page.tsx" "My Results"
create_page "$APP_DIR/(candidate)/take/[attemptId]/page.tsx" "Take Examination" "The timed test engine will be connected here."
create_page "$APP_DIR/(candidate)/take/[attemptId]/submit/page.tsx" "Submission Receipt" "Submission itself must use a verified POST operation, not a page visit."

# Fail-closed API placeholders. Every stub responds with HTTP 501; it does not
# log anyone in, issue tokens, save answers, or mutate the database.
create_api_route() {
  local file="$1" method="$2"
  write_if_missing "$file" "import { NextResponse } from \"next/server\";

export async function $method() {
  return NextResponse.json(
    { error: \"Not implemented\" },
    { status: 501, headers: { \"Cache-Control\": \"no-store\" } },
  );
}"
}

create_api_route "$APP_DIR/api/cbt/candidates/import/route.ts" POST
create_api_route "$APP_DIR/api/cbt/access/login/route.ts" POST
create_api_route "$APP_DIR/api/cbt/access/session/route.ts" GET
create_api_route "$APP_DIR/api/cbt/attempts/[id]/route.ts" GET
create_api_route "$APP_DIR/api/cbt/attempts/[id]/answers/route.ts" POST
create_api_route "$APP_DIR/api/cbt/attempts/[id]/submit/route.ts" POST

printf '\nDone. Created: %d | Kept existing: %d | Skipped URL conflicts: %d\n' "$created" "$kept" "$skipped"
echo "App directory: $APP_DIR"
echo "No existing files were overwritten."
echo "Note: (staff)/layout.tsx intentionally redirects to /login until an auth guard is implemented."
