require 'influence'

class Channel < ApplicationRecord
  belongs_to :hunter

  SUPPORTED_CHANNELS = %w(reddit youtube twitter instagram medium steemit others)

  validates_presence_of :channel_name, :url
  validates :channel_name, inclusion: { in: SUPPORTED_CHANNELS }
  validate :url_format
  validates :username, uniqueness: { scope: :channel_name, message: '"%{value}" has already been subscribed' }, allow_nil: true

  def url_format
    unless url =~ /\A#{URI::regexp(['http', 'https'])}\z/
      errors.add(:url, "- \"#{url}\" is invalid URL format.")
    end

    return if channel_name == 'others'

    klass = Influence.const_get(channel_name.capitalize)
    self.username = klass.parse(url)

    errors.add(:url, "- \"#{url}\" - Please type a valid profile URL. It should be #{klass::FORMAT} format.") unless self.username

    begin
      self.score = klass.score(self.username)
    rescue => e
      Rails.logger.error "Failed get username on #{channel_name.capitalize}: #{e}"

      errors.add(:url, "- \"#{url}\" - cannot be found") unless self.username
    end
  end

  def self.follower_name(channel)
    case channel
    when 'reddit'
      'Karmas'
    when 'youtube'
      'Subscribers'
    else
      'Followers'
    end
  end

  def update_score!
    klass = Influence.const_get(channel_name.capitalize)
    self.score = klass.score(klass.parse(url))
    self.save!
  end
end
