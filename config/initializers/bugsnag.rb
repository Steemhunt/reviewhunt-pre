Bugsnag.configure do |config|
  config.api_key = ENV['BUG_SNAG_KEY']
  config.notify_release_stages = ['production']
end
