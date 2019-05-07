require "administrate/base_dashboard"

class MakerDashboard < Administrate::BaseDashboard
  # ATTRIBUTE_TYPES
  # a hash that describes the type of each of the model's fields.
  #
  # Each different type represents an Administrate::Field object,
  # which determines how the attribute is displayed
  # on pages throughout the dashboard.
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    email: Field::Email,
    company_name: Field::String,
    name: Field::String,
    position: Field::String,
    business_category: Field::String,
    monthly_budget: Field::Number.with_options(prefix: '$', decimals: 2, searchable: false),
    language: Field::String.with_options(searchable: false),
    coupon_code: Field::String.with_options(searchable: false),
    created_at: Field::DateTime.with_options(format: '%Y-%m-%dT%H:%M:%S%z'),
    updated_at: Field::DateTime.with_options(format: '%Y-%m-%dT%H:%M:%S%z')
  }.freeze

  # COLLECTION_ATTRIBUTES
  # an array of attributes that will be displayed on the model's index page.
  #
  # By default, it's limited to four items to reduce clutter on index pages.
  # Feel free to add, remove, or rearrange items.
  COLLECTION_ATTRIBUTES = [
    :id,
    :email,
    :company_name,
    :name,
    :monthly_budget,
    :language,
    :coupon_code,
    :created_at
  ].freeze

  # SHOW_PAGE_ATTRIBUTES
  # an array of attributes that will be displayed on the model's show page.
  SHOW_PAGE_ATTRIBUTES = [
    :id,
    :email,
    :company_name,
    :name,
    :position,
    :business_category,
    :monthly_budget,
    :language,
    :coupon_code,
    :created_at,
    :updated_at,
  ].freeze

  # FORM_ATTRIBUTES
  # an array of attributes that will be displayed
  # on the model's form (`new` and `edit`) pages.
  FORM_ATTRIBUTES = [
    :email,
    :company_name,
    :name,
    :position,
    :business_category,
    :monthly_budget,
    :coupon_code,
    :language
  ].freeze

  # Overwrite this method to customize how makers are displayed
  # across all pages of the admin dashboard.
  #
  # def display_resource(maker)
  #   "Maker ##{maker.id}"
  # end
end
