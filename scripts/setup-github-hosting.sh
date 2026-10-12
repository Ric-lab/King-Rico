#!/usr/bin/env bash
# Run once in the owner's Google Cloud Shell. No downloaded keys or billing changes.
set -euo pipefail
task_project=king-rico
task_expected_number=776388739192
task_repo=Ric-lab/King-Rico
task_pool=king-rico-github
task_provider=github
task_account=king-rico-hosting
task_email="$task_account@$task_project.iam.gserviceaccount.com"

# A newly created account can be visible to IAM before project policies accept
# it. Retry only that propagation error; other failures still stop immediately.
task_grant_hosting_role() {
  local task_output task_status task_attempt=1 task_delay
  local -a task_delays=(2 4 8 16 30 30)
  while true; do
    if task_output=$(gcloud projects add-iam-policy-binding "$task_project" \
      --member="serviceAccount:$task_email" --role=roles/firebasehosting.admin --condition=None --quiet 2>&1); then
      return 0
    else
      task_status=$?
    fi
    if [[ "$task_output" != *"Service account $task_email does not exist"* ]] || \
      (( task_attempt > ${#task_delays[@]} )); then
      printf '%s\n' "$task_output" >&2
      return "$task_status"
    fi
    task_delay=${task_delays[task_attempt-1]}
    printf 'O Google ainda está propagando a conta de publicação. Nova tentativa em %ss (%s/%s).\n' \
      "$task_delay" "$task_attempt" "${#task_delays[@]}"
    sleep "$task_delay"
    task_attempt=$((task_attempt+1))
  done
}

command -v gcloud >/dev/null || { printf '%s\n' 'Execute este script no Google Cloud Shell.' >&2; exit 1; }
task_number=$(gcloud projects describe "$task_project" --format='value(projectNumber)')
if [ "$task_number" != "$task_expected_number" ]; then
  printf '%s\n' 'Projeto inesperado. Nenhuma alteração foi feita.' >&2
  exit 1
fi

gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com firebasehosting.googleapis.com \
  --project="$task_project" --quiet

if ! gcloud iam service-accounts describe "$task_email" --project="$task_project" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$task_account" --project="$task_project" \
    --display-name='Publicação do King Rico pelo GitHub' --quiet
fi
task_grant_hosting_role

if ! gcloud iam workload-identity-pools describe "$task_pool" --project="$task_project" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools create "$task_pool" --project="$task_project" --location=global \
    --display-name='King Rico GitHub' --quiet
fi

task_condition="assertion.repository == '$task_repo' && assertion.ref == 'refs/heads/main'"
task_mapping='google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref'
if gcloud iam workload-identity-pools providers describe "$task_provider" \
  --workload-identity-pool="$task_pool" --project="$task_project" --location=global >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "$task_provider" \
    --workload-identity-pool="$task_pool" --project="$task_project" --location=global \
    --issuer-uri=https://token.actions.githubusercontent.com \
    --attribute-mapping="$task_mapping" --attribute-condition="$task_condition" --quiet
else
  gcloud iam workload-identity-pools providers create-oidc "$task_provider" \
    --workload-identity-pool="$task_pool" --project="$task_project" --location=global \
    --issuer-uri=https://token.actions.githubusercontent.com \
    --attribute-mapping="$task_mapping" --attribute-condition="$task_condition" --quiet
fi

gcloud iam service-accounts add-iam-policy-binding "$task_email" --project="$task_project" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$task_number/locations/global/workloadIdentityPools/$task_pool/attribute.repository/$task_repo" \
  --quiet >/dev/null

# Ensure the named static Hosting site exists. Keep the owner's access token in
# process memory and send it only to the official Hosting API, never to stdout.
python3 - "$task_project" <<'PY'
import json, subprocess, sys, urllib.error, urllib.request
project=sys.argv[1]
token=subprocess.check_output(['gcloud','auth','print-access-token'],text=True).strip()
base=f'https://firebasehosting.googleapis.com/v1beta1/projects/{project}/sites'
headers={'Authorization':f'Bearer {token}','Content-Type':'application/json'}
try:
    with urllib.request.urlopen(urllib.request.Request(base+'/'+project,headers=headers),timeout=30) as response:
        json.load(response)
except urllib.error.HTTPError as error:
    if error.code != 404:
        raise SystemExit(f'Não foi possível conferir o site: HTTP {error.code}')
    with urllib.request.urlopen(urllib.request.Request(base+'?siteId='+project,data=b'{}',headers=headers,method='POST'),timeout=30) as response:
        json.load(response)
print('Site do Hosting pronto: '+project)
PY

printf '%s\n' 'Conexão GitHub → Firebase configurada.' \
  'As alterações da branch main serão publicadas após os testes.' \
  'A autorização do Google pode levar alguns minutos para propagar.'
