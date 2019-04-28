class AddUserNameOnChannel < ActiveRecord::Migration[5.2]
  def change
    remove_index :channels, :url
    add_column :channels, :username, :string, default: nil
    add_index :channels, [:channel_name, :username], unique: true

    Channel.all.each do |c|
      next if c.channel_name == 'others'
      klass = Influence.const_get(c.channel_name.capitalize)
      c.username = klass.parse(c.url)
      c.save!
    end
  end
end
