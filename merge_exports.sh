#! /bin/bash

## Set the default merge output
output_file="merged.csv"

## Try and get the specified output file if there is one
while getopts o: opt
do
	case "$opt" in
	o) 	output_file="$OPTARG"
	esac
	shift && shift
done

## Check there are files to merge
if [ $# -eq 0 ]
then
	echo "You must specify some files to merge\n"
	exit 1
fi

## Merge them all
first_file=1
while [ $# -gt 0 ]
do
	if [ $first_file -eq 1 ]
	then
		cat "$1" > "$output_file"
	else
		tail -n +2 "$1" >> "$output_file"
	fi
	first_file=0
	shift
done