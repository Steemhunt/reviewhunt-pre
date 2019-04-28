class AddUniqueConstraintsOnChannelUrl < ActiveRecord::Migration[5.2]
  def change
    add_index :channels, :url, unique: true
  end
end
