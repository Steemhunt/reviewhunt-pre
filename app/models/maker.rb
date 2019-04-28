class Maker < ApplicationRecord
  BUSINESS_CATEGORIES = [
    'Advertising',
    'Social',
    'Games',
    'Commerce',
    'Blockchain',
    'Electronics and Gadgets',
    'Health and Fitness',
    'Education',
    'Kids',
    'Lifestyle',
    'Banking and Finance',
    'Music',
    'News and Magazines',
    'Travel',
    'Photo and Video',
    'Sports and Outdoors',
    'Productivity',
    'Location-based Business',
    'Others'
  ]
  validates_presence_of :company_name, :name, :email, :position, :business_category, :monthly_budget
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :monthly_budget, numericality: { greater_than: 0 }
  validates :business_category, inclusion: { in: BUSINESS_CATEGORIES }
  validates_uniqueness_of :email
end
