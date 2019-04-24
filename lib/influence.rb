require 'utils'
require 'steem'

module Influence
  module Reddit
    def self.score(username)
      res = Utils.json("https://www.reddit.com/user/#{username}/about.json")
      res['data']['link_karma'].to_i + res['data']['comment_karma'].to_i
    end
  end

  module Youtube
    def self.score(channel_id)
      res = Utils.json("https://www.googleapis.com/youtube/v3/channels?part=statistics&id=#{channel_id}&key=#{ENV['YOUTUBE_API_KEY']}")
      res['items'][0]['statistics']['subscriberCount']
    end
  end

  module Twitter
    def self.score(username)
      res = Utils.json("https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=#{username}")
      res[0]['followers_count']
    end
  end

  module Instagram
    def self.score(username)
      res = Utils.json("https://www.instagram.com/web/search/topsearch/?query=#{username}")
      res['users'][0]['user']['follower_count']
    end
  end

  module Medium
    def self.score(username)
      res = Utils.json("https://medium.com/@#{username}/followers/?format=json")
      res['payload']['references']['SocialStats'].values[0]['usersFollowedByCount']
    end
  end

  module SteemDapps
    def self.score(username)
      Steem::CondenserApi.new.get_follow_count(username).result.follower_count
    end
  end
end
