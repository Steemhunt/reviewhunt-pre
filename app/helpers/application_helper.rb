module ApplicationHelper
  def hashed_name(name)
    name.titleize.first(2) + (['*'] * (3..10).to_a.sample).join + name.last
  end
end
