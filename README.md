MoneyBook Stats
===============

MoneyBook Stats is a small app which gives you greater visualisation capabilities over your MoneyBook data. 

Usage
-----

The main app is a simple Sinatra app written in Ruby. To get it running, do the following:

    sudo gem install sinatra json csv
    ruby stats.rb
    
You can then view the app by navigating to [http://localhost:4567](http://localhost:4567).
    
You can export all your data from the [MoneyBook webapp](http://my.moneybookapp.com). One issue with this is that it will only let you export one month at a time. A merging tool is provided, and can be used as follows:

    sh merge_exports.sh -o output.csv moneybookexports/*.csv
    
That will merge all the exports into output.csv, which can be uploaded to the app for visualising. 

Todo
----

* Dynamic loading of visualisation source files
* Handle page layout a bit more nicely