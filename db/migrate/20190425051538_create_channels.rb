class CreateChannels < ActiveRecord::Migration[5.2]
  def change
    create_table :channels do |t|
      t.references :user, null: false
      t.string :channel_name, null: false
      t.string :url, null: false
      t.decimal :score, default: 0

      t.timestamps
    end
  end
end
