class AddLanguageOnUsers < ActiveRecord::Migration[5.2]
  def change
    add_column :hunters, :language, :string, default: 'en'
    add_column :makers, :language, :string, default: 'en'

    Hunter.all.each do |h|
      h.update! language: 'ko' if h.detect_language == 'ko'
    end

    Maker.all.each do |m|
      m.update! language: 'ko' if m.detect_language == 'ko'
    end
  end
end
