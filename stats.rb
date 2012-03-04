require 'rubygems'
require 'sinatra'
require 'json'
require 'csv'

get '/' do
  erb(:index, {}, :error_message => false)
end

post '/' do
  data = CSV.parse(params[:csv_data][:tempfile].read)
  if data
    data = data.drop(1)
    data.sort! {|a,b| Date.strptime(a[0], "%d/%m/%Y") <=> Date.strptime(b[0], "%d/%m/%Y")}
    erb(:stats, {}, :json_data => data.to_json, :file_name => params[:csv_data][:filename])
  else
    erc(:index, {}, :error_message => true)
  end
end