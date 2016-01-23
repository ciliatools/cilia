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

export ROOT = /tmp/cilia
export BRANCH = $(CILIA_BRANCH)
export URL = $(CILIA_URL)
export ID = $(CILIA_ID)
export DEPTH = 1
export TMP_ARTIFACTS = /tmp/artifacts

test:
	./setup
	./dequeue ./worker ./test-client.sh

reset:; ./reset

serve:; python3 -m http.server 3000

inspect:
	./inspect > /tmp/index.html
	mv /tmp/index.html index.html

build:
	docker build -t cilia/server .

.PHONY: test reset inspect build

