class FixUniqueIndex < ActiveRecord::Migration[5.2]
  def up
    remove_index :channels, [:channel_name, :username]
    add_index :channels, [ :channel_name, :username ]
  end

  def down
    remove_index :channels, [:channel_name, :username]
    add_index :channels, [:channel_name, :username], unique: true
  end
end
