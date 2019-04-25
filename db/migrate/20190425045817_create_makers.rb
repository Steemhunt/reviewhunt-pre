class CreateMakers < ActiveRecord::Migration[5.2]
  def change
    create_table :makers do |t|
      t.string :email, null: false
      t.string :company_name, null: false
      t.string :name, null: false
      t.string :position, null: false
      t.decimal :monthly_budget, null: false

      t.timestamps
    end
  end
end
