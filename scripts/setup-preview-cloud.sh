#!/usr/bin/env bash
# Run once in the owner's authenticated Google Cloud Shell. No production IAM.
set -euo pipefail
preview_project="${1:-king-rico-previa-1408805633}"
[[ "$preview_project" == king-rico-previa-* && "$preview_project" != king-rico ]] || { echo 'Use a distinct king-rico-previa-* project.' >&2; exit 1; }
command -v gcloud >/dev/null
command -v python3 >/dev/null
account="$(gcloud auth list --filter=status:ACTIVE --format='value(account)')"
[[ -n "$account" ]] || { echo 'Open Cloud Shell with the Google account that owns King Rico.' >&2; exit 1; }
if gcloud projects describe "$preview_project" --format=json > /tmp/king-rico-preview-project.json 2>/dev/null; then
  python3 -c 'import json; p=json.load(open("/tmp/king-rico-preview-project.json")); assert p.get("labels",{}).get("preview-repository")=="1408805633", "Refusing to modify an existing unmarked project"'
else
  gcloud projects create "$preview_project" --name='King Rico Preview' --labels=preview-repository=1408805633
fi
# No billing association, no Firestore, no modification of king-rico.
gcloud services enable firebase.googleapis.com firebasehosting.googleapis.com iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com cloudresourcemanager.googleapis.com --project="$preview_project"
project_number="$(gcloud projects describe "$preview_project" --format='value(projectNumber)')"
# Access tokens are used only for these HTTPS requests; never printed or saved.
api(){ curl --fail-with-body --silent --show-error -H "Authorization: Bearer $(gcloud auth print-access-token)" -H 'Content-Type: application/json' "$@"; }
if ! api "https://firebase.googleapis.com/v1beta1/projects/$preview_project" >/dev/null 2>&1; then
  operation="$(api -X POST -d '{}' "https://firebase.googleapis.com/v1beta1/projects/$preview_project:addFirebase" | python3 -c 'import json,sys; print(json.load(sys.stdin)["name"])')"
  for attempt in $(seq 1 60); do
    status="$(api "https://firebase.googleapis.com/v1beta1/$operation")"
    done_state="$(printf '%s' "$status" | python3 -c 'import json,sys; p=json.load(sys.stdin); assert "error" not in p,p.get("error"); print(p.get("done",False))')"
    [[ "$done_state" == True ]] && break
    sleep 5
  done
  [[ "$done_state" == True ]] || { echo 'Firebase activation is still pending; rerun after it completes.' >&2; exit 1; }
fi
if ! api "https://firebasehosting.googleapis.com/v1beta1/projects/$preview_project/sites/$preview_project" >/dev/null 2>&1; then
  api -X POST -d '{}' "https://firebasehosting.googleapis.com/v1beta1/projects/$preview_project/sites?siteId=$preview_project" >/dev/null
fi
pool=king-rico-preview-github
if ! gcloud iam workload-identity-pools describe "$pool" --project="$preview_project" --location=global >/dev/null 2>&1; then
  if ! gcloud iam workload-identity-pools create "$pool" --project="$preview_project" --location=global --display-name='King Rico Preview GitHub'; then
    # A freshly created project can still be propagating its Owner binding.
    # Grant the documented WIF admin role to the setup user in THIS project only.
    [[ "$account" == *@* && "$account" != *.gserviceaccount.com ]] || { echo 'Run setup as the project owner user.' >&2; exit 1; }
    gcloud projects add-iam-policy-binding "$preview_project" --member="user:$account" --role=roles/iam.workloadIdentityPoolAdmin --condition=None >/dev/null
    pool_ready=false
    for attempt in $(seq 1 6); do
      echo "Waiting for preview-project IAM propagation ($attempt/6)..."
      sleep 10
      if gcloud iam workload-identity-pools describe "$pool" --project="$preview_project" --location=global >/dev/null 2>&1 || gcloud iam workload-identity-pools create "$pool" --project="$preview_project" --location=global --display-name='King Rico Preview GitHub'; then
        pool_ready=true; break
      fi
    done
    [[ "$pool_ready" == true ]] || { echo 'WIF pool creation is still denied. Send this error; do not change production IAM.' >&2; exit 1; }
  fi
fi
condition="assertion.repository_id=='1408805633' && assertion.repository_owner_id=='195614404' && assertion.ref.startsWith('refs/heads/codex/') && assertion.workflow_ref.startsWith('Ric-lab/King-Rico/.github/workflows/preview-channel.yml@refs/heads/codex/') && (assertion.event_name=='push' || assertion.event_name=='workflow_dispatch')"
if ! gcloud iam workload-identity-pools providers describe github --project="$preview_project" --location=global --workload-identity-pool="$pool" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers create-oidc github --project="$preview_project" --location=global --workload-identity-pool="$pool" --issuer-uri=https://token.actions.githubusercontent.com --attribute-mapping='google.subject=assertion.sub,attribute.repository_id=assertion.repository_id' --attribute-condition="$condition"
fi
service_account="king-rico-preview@$preview_project.iam.gserviceaccount.com"
if ! gcloud iam service-accounts describe "$service_account" --project="$preview_project" >/dev/null 2>&1; then
  gcloud iam service-accounts create king-rico-preview --project="$preview_project" --display-name='Hosting preview only project'
fi
gcloud projects add-iam-policy-binding "$preview_project" --member="serviceAccount:$service_account" --role=roles/firebasehosting.admin --condition=None >/dev/null
gcloud iam service-accounts add-iam-policy-binding "$service_account" --project="$preview_project" --role=roles/iam.workloadIdentityUser --member="principalSet://iam.googleapis.com/projects/$project_number/locations/global/workloadIdentityPools/$pool/attribute.repository_id/1408805633" >/dev/null
provider="projects/$project_number/locations/global/workloadIdentityPools/$pool/providers/github"
printf '\nProvisioned preview project. No billing linked, production unchanged.\n'
printf 'KING_RICO_PREVIEW_PROJECT_ID=%s\nKING_RICO_PREVIEW_PROVIDER=%s\n' "$preview_project" "$provider"
if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
  gh variable set KING_RICO_PREVIEW_PROJECT_ID --repo Ric-lab/King-Rico --body "$preview_project"
  gh variable set KING_RICO_PREVIEW_PROVIDER --repo Ric-lab/King-Rico --body "$provider"
  echo 'GitHub repository variables saved. Push this branch to start publication.'
else
  echo 'Copy the two non-secret values above to the GitHub repository Actions variables, or send them to Codex.'
fi
