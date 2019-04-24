module Utils
  def self.json(url)
    begin
      headers = {
        'Accept' => 'application/json',
        'User-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
      }
      result = Faraday.new(url, headers: headers).get
      body = result.body.gsub(/^\]\)\}while\(1\);<\/x>/, '')
      JSON.parse(body)
    rescue => e
      Rails.logger.error "JSON parse error: #{url} => #{e}"
    end
  end
end