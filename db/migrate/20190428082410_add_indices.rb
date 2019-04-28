class AddIndices < ActiveRecord::Migration[5.2]
  def change
    add_index :hunters, :email, unique: true
    add_index :makers, :email, unique: true
    add_index :channels, :channel_name
  end
end
