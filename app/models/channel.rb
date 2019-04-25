class Channel < ApplicationRecord
  belongs_to :user

  SUPPORTED_CHANNELS = %w(reddit youtube twitter instagram medium steem others)

  validates_presence_of :channel_name, :url
  validates :channel_name, inclusion: { in: SUPPORTED_CHANNELS }
end
