require 'csv'

def slugify(text)
  text.downcase
      .strip
      .gsub(/[^a-z0-9\s-]/, '')
      .gsub(/\s+/, '-')
      .gsub(/-+/, '-')
end

def safe_date(text)
  if text.include? "/"
    month, day, year = text.split("/")
    DateTime.new(year.to_i, month.to_i, day.to_i)
  else
    DateTime.parse(text)
  end
end

content = File.read('events.csv', encoding: 'windows-1252:utf-8')
doc = CSV.parse(content, headers: true)

doc.each do |entry|
  start_date = safe_date(entry["Start Date"])
  end_date = safe_date(entry["End Date"])
  buf = <<~TEMPLATE
  ---
  layout: event
  title: #{entry["Title"]}
  start_time: #{start_date.strftime("%Y-%m-%d %H:%M:00")}
  end_time: #{end_date.strftime("%Y-%m-%d %H:%M:00")}
  location: #{entry["Location"]}
  description:  |
    #{entry['Description'].gsub(/\n/, "\n  ")}
  ---
  TEMPLATE

  filename = sprintf("%-4.4d-%-2.2d-%s.html", start_date.year, start_date.month, slugify(entry['Title']))
  IO.write("../_events/#{filename}", buf)
end
