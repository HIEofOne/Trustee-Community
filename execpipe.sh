#!/bin/bash
# docker pipe command script
while true; do eval "$(cat /root/Trustee-Community/docker/traefik/pipe)" &> /root/Trustee-Community/docker/traefik/output.txt; done
