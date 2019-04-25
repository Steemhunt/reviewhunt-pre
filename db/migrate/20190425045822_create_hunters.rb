class CreateHunters < ActiveRecord::Migration[5.2]
  def change
    create_table :hunters do |t|
      t.string :email, null: false
      t.string :name, null: false
      t.string :country_code, null: false

      t.timestamps
    end
  end
end
