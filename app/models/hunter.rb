class Hunter < ApplicationRecord
  validates_presence_of :email, :name, :country_code
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
end
