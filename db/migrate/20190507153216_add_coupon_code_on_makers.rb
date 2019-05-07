class AddCouponCodeOnMakers < ActiveRecord::Migration[5.2]
  def change
    add_column :makers, :coupon_code, :string, default: nil

    Maker.all.each do |m|
      m.generate_coupon_code
      m.save!
    end
  end
end
