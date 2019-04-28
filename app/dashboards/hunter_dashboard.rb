require "administrate/base_dashboard"

class HunterDashboard < Administrate::BaseDashboard
  # ATTRIBUTE_TYPES
  # a hash that describes the type of each of the model's fields.
  #
  # Each different type represents an Administrate::Field object,
  # which determines how the attribute is displayed
  # on pages throughout the dashboard.
  ATTRIBUTE_TYPES = {
    id: Field::Number,
    email: Field::String,
    name: Field::String,
    country_code: Field::String,
    country_name: Field::String,
    channels: Field::HasMany,
    channel_summary: Field::String,
    total_score: Field::Number,
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
    :name,
    :country_name,
    :channel_summary,
    :total_score,
    :created_at
  ].freeze

  # SHOW_PAGE_ATTRIBUTES
  # an array of attributes that will be displayed on the model's show page.
  SHOW_PAGE_ATTRIBUTES = [
    :channels,
    :id,
    :email,
    :name,
    :country_code,
    :created_at,
    :updated_at,
  ].freeze

  # FORM_ATTRIBUTES
  # an array of attributes that will be displayed
  # on the model's form (`new` and `edit`) pages.
  FORM_ATTRIBUTES = [
    :channels,
    :email,
    :name,
    :country_code,
  ].freeze

  # Overwrite this method to customize how hunters are displayed
  # across all pages of the admin dashboard.
  #
  # def display_resource(hunter)
  #   "Hunter ##{hunter.id}"
  # end
end
