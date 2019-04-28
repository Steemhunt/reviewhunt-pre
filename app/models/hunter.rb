class Hunter < ApplicationRecord
  has_many :channels, dependent: :destroy
  accepts_nested_attributes_for :channels

  validates_presence_of :email, :name, :country_code
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :country_code, inclusion: { in: ISO3166::Country.codes }
  validates_uniqueness_of :email

  def country_name
    country = ISO3166::Country[country_code]
    country.translations[I18n.locale.to_s] || country.name
  end

  def total_score
    channels.sum(:score)
  end

  def channel_summary
    channels.map { |c| "#{c.channel_name.capitalize} (#{c.score.to_i})" }.join(", ")
  end
end
