require 'utils'
require 'steem'

module Influence
  def self.format2regex(format)
    escaped = format.gsub('/', '\/').
      gsub('www.', '(www.)?').
      gsub('.', '\.').
      gsub('{username}', '(?<username>[A-Za-z0-9\.-_]+)')
    /#{escaped}/
  end

  def self.parse(format, url)
    if matched = url.match(format2regex(format))
      matched[:username]
    else
      nil
    end
  end

  module Reddit
    FORMAT = "https://www.reddit.com/user/{username}"

    def self.parse(url)
      Influence.parse(FORMAT, url)
    end

    def self.score(username)
      res = Utils.json("https://www.reddit.com/user/#{username}/about.json")
      res['data']['link_karma'].to_i + res['data']['comment_karma'].to_i
    end
  end

  module Youtube
    FORMAT = "https://www.youtube.com/channel/{username}"

    def self.parse(url)
      Influence.parse(FORMAT, url)
    end

    def self.score(channel_id)
      res = Utils.json("https://www.googleapis.com/youtube/v3/channels?part=statistics&id=#{channel_id}&key=#{ENV['YOUTUBE_API_KEY']}")
      res['items'][0]['statistics']['subscriberCount']
    end
  end

  module Twitter
    FORMAT = "https://www.twitter.com/{username}"

    def self.parse(url)
      Influence.parse(FORMAT, url)
    end

    def self.score(username)
      res = Utils.json("https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=#{username}")
      res[0]['followers_count']
    end
  end

  module Instagram
    FORMAT = "https://www.instagram.com/{username}"

    def self.parse(url)
      Influence.parse(FORMAT, url)
    end

    def self.score(username)
      res = Utils.json("https://www.instagram.com/web/search/topsearch/?query=#{username}")
      res['users'][0]['user']['follower_count']
    end
  end

  module Medium
    FORMAT = "https://medium.com/@{username}"

    def self.parse(url)
      Influence.parse(FORMAT, url)
    end

    def self.score(username)
      res = Utils.json("https://medium.com/@#{username}/followers/?format=json")
      res['payload']['references']['SocialStats'].values[0]['usersFollowedByCount']
    end
  end

  module Steemit
    FORMAT = "https://steemit.com/@{username}"

    def self.parse(url)
      Influence.parse(FORMAT, url)
    end

    def self.score(username)
      ::Steem::CondenserApi.new.get_follow_count(username).result.follower_count
    end
  end
end
