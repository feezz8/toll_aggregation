se2460 healthcheck
read -p "Press any key to resume ..."
se2460 resetpasses
read -p "Press any key to resume ..."
se2460 healthcheck
read -p "Press any key to resume ..."
se2460 resetstations
read -p "Press any key to resume ..."
se2460 healthcheck
read -p "Press any key to resume ..."
se2460 admin --addpasses --source passes60.csv
read -p "Press any key to resume ..."
se2460 healthcheck
read -p "Press any key to resume ..."
se2460 tollstationpasses --station AM08 --from 20220508 --to 20220522 --format json
read -p "Press any key to resume ..."
se2460 tollstationpasses --station NAO04 --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station NO01 --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station OO03 --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station XXX --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station OO03 --from 20220508 --to 20220522 --format YYY
read -p "Press any key to resume ..."
se2460 errorparam --station OO03 --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station AM08 --from 20220509 --to 20220520 --format json
read -p "Press any key to resume ..."
se2460 tollstationpasses --station NAO04 --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station NO01 --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station OO03 --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station XXX --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 tollstationpasses --station OO03 --from 20220509 --to 20220520 --format YYY
read -p "Press any key to resume ..."
se2460 passanalysis --stationop AM --tagop NAO --from 20220508 --to 20220522 --format json
read -p "Press any key to resume ..."
se2460 passanalysis --stationop NAO --tagop AM --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 passanalysis --stationop NO --tagop OO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 passanalysis --stationop OO --tagop KO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 passanalysis --stationop XXX --tagop KO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 passanalysis --stationop AM --tagop NAO --from 20220509 --to 20220520 --format json
read -p "Press any key to resume ..."
se2460 passanalysis --stationop NAO --tagop AM --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 passanalysis --stationop NO --tagop OO --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 passanalysis --stationop OO --tagop KO --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 passanalysis --stationop XXX --tagop KO --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 passescost --stationop AM --tagop NAO --from 20220508 --to 20220522 --format json
read -p "Press any key to resume ..."
se2460 passescost --stationop NAO --tagop AM --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 passescost --stationop NO --tagop OO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 passescost --stationop OO --tagop KO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 passescost --stationop XXX --tagop KO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 passescost --stationop AM --tagop NAO --from 20220509 --to 20220520 --format json
read -p "Press any key to resume ..."
se2460 passescost --stationop NAO --tagop AM --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 passescost --stationop NO --tagop OO --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 passescost --stationop OO --tagop KO --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 passescost --stationop XXX --tagop KO --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 chargesby --opid NAO --from 20220508 --to 20220522 --format json
read -p "Press any key to resume ..."
se2460 chargesby --opid GE --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 chargesby --opid OO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 chargesby --opid KO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 chargesby --opid NO --from 20220508 --to 20220522 --format csv
read -p "Press any key to resume ..."
se2460 chargesby --opid NAO --from 20220509 --to 20220520 --format json
read -p "Press any key to resume ..."
se2460 chargesby --opid GE --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 chargesby --opid OO --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 chargesby --opid KO --from 20220509 --to 20220520 --format csv
read -p "Press any key to resume ..."
se2460 chargesby --opid NO --from 20220509 --to 20220520 --format csv
