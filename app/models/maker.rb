class Maker < ApplicationRecord
  validates_presence_of :email, :company_name, :name, :position, :monthly_budget
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :monthly_budget, numericality: { greater_than: 0 }
end
