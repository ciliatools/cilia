#!/usr/bin/env bash
# This file is part of Cilia.
# 
# Copyright (C) 2016  Mikael Brockman
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# Generate the Cilia dashboard HTML.

set -uex
echo '<!doctype html>'
echo '<meta charset=utf-8>'
echo '<title>Cilia</title>'
echo '<style>'
cat index.css
echo -e "</style><body>"
echo -e "<script>"
echo -e "document.documentElement.classList.add('js')"
echo "</script>"
cilia=`pwd`

for x in "$ROOT"/projects/*; do
  id=`basename "$x"`
  echo "<project>"
  echo "<nav>"
  echo "<h1>Cilia</h1>"
  echo "<button id=watchbutton>Watch</button>"
  echo "<a href=#><b>$id</b> (branch: $BRANCH)</a>"
  echo "</nav>"
  echo "<main>"
  commits=$( cd "$x"/runs; ls | "$cilia"/sort-commits )
  for hash in $commits; do
    run="$x"/runs/"$hash"
    if [ -e "$run"/status ]; then
      echo \<run id=run-$hash data-hash=$hash data-status=`cat "$run"/status`\>
      echo -n '<commit>'
      if [ -s "$run"/started ]; then
        echo -n "Started: "
        date --date=@`cat "$run"/started`
        echo
      fi
      ./describe-commit "$hash" | ./escape-html
      echo -n '</commit>'
      echo -n '<log>'
      [ -e "$run"/log ] && ./escape-html < "$run"/log || true
      [ -s "$run"/elapsed ] && {
        secs=`cat "$run"/elapsed | tail -n1`
        secs=`perl -e "print int($secs + .5)"` # round to integer
        echo "<br>"
        echo -n '<time>'
        printf "Finished in %d minutes, %d seconds.\n" \
          $(($secs / 60)) $(($secs % 60))
        echo '</time>'
      } || true
      [ -d "$run"/artifacts ] && {
        for artifact in "$run"/artifacts/*; do
          relative="work/${artifact#$ROOT}"
          printf '<a href="%s">%s</a>\n' "$relative" "$(basename "$x")"
        done
      } || true
      echo -n '</log>'
      echo '</run>'
    fi
  done
  echo "</main>"
  echo "</project>"
done
echo '<script>'
cat index.js
echo '</script>'
