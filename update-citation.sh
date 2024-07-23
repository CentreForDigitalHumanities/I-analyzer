version=`grep -o '\d\+\.\d\+\.\d\+' package.json`
today=`date +'%Y-%m-%d'`
sed -i '' "s/^version:.*$/version: $version/g" CITATION.cff
sed -i '' "s/^date-released:.*$/date-released: \'$today\'/g" CITATION.cff
