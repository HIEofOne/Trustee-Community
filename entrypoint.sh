#!/bin/bash
# no verbose
set +x
# config
envFilename='env.production'
newEnv='.env.production.local'
function apply_path {
  # read all config file  
  while read line; do
    # no comment or not empty
    if [ "${line:0:1}" == "#" ] || [ "${line}" == "" ]; then
      continue
    fi
    # split
    configName="$(cut -d'=' -f1 <<<"$line")"
    configValue="$(cut -d'=' -f2 <<<"$line")"
    # get system env
    envValue=$(env | grep "^$configName=" | grep -oe '[^=]*$');
    # if config found
    if [ -n "$configValue" ] && [ -n "$envValue" ]; then
      # replace all
      echo "Replace: ${configValue} with: ${envValue}"
      sed -i "s#$configValue#$envValue#g" $newEnv
    fi
  done < $envFilename
}
apply_path
echo "Starting NextJS - Trustee Community"
exec "$@"