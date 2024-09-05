#!/bin/bash

doCheckin=0
doCheckout=0
doUncheckout=0
doNoComment=0
doComment=0
doTree=0
doTreeGrafical=0
doConfigspec=0
doDescribe=0

theComment=""
theFormat=""

usage() {
  echo "cleartool.sh - simulate cleartool for test purpose"
  echo ""
  echo "cleartool.sh [--comment msg|-nc]"
  echo "options:"
  echo "-h, --help      show this message"
  echo "--comment       show this message"
}

checkin() {
  echo "checkin version"
}

# $@ is all command line parameters passed to the script.
# -o is for short options like -v
# -l is for long options with double dash like --version
# the comma separates different long options
# -a is for long options with single dash like -version

# options=$(getopt -l "help,comment:,checkout,checkin,lsvtree" -o "h" -a "nc,fmt:,grafical" "$@")
# eval set -- "$options"

while true; do
  case "$1" in
  -h | --help)
    usage
    exit 0
    ;;
  ci | checkin)
    checkin
    ;;
  co | checkout)
    doCheckout=1
    ;;
  unco | uncheckout)
    doCheckout=1
    ;;
  lsvtree)
    doTree=1
    ;;
  unco | uncheckout)
    doCheckout=1
    ;;
  -nc)
    doNoComment=1
    ;;
  -grahpical)
    doTreeGrafical=1
    ;;
  --comment)
    shift
    theComment="$1"
    doComment=1
    ;;
  -fmt)
    shift
    theFormat="$1"
    ;;
  --)
    shift
    break
    ;;
  esac
  shift
  if [ $#==0 ]; then
    break
  fi
done