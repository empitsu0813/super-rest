import mongoose, { Schema, Document, Model } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'
import slug from 'slug'
import { User, IUserModel } from './Users'
import { ICommentModel } from './Comments'

interface IArticle extends Document {
  slug: string
  title: string
  description: string
  body: string
  favoritesCount: number
  comments: ICommentModel
  tagList: []
  author: IUserModel
}

export interface IArticleModel extends IArticle {
  slugify(): void
  updateFavoriteCount(): void
  toJSONFor(user: IUserModel): object
}

const articleSchema = new Schema(
  {
    slug: { type: String, lowercase: true, unique: true },
    title: String,
    description: String,
    body: String,
    favoritesCount: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    tagList: [{ type: String }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

articleSchema.plugin(uniqueValidator, { message: 'is already taken' })

articleSchema.pre<IArticleModel>('validate', function(next) {
  if (!this.slug) {
    this.slugify()
  }

  next()
})

articleSchema.methods.slugify = function() {
  this.slug =
    slug(this.title) +
    '-' +
    ((Math.random() * Math.pow(36, 6)) | 0).toString(36)
}

articleSchema.methods.updateFavoriteCount = function() {
  var article = this

  return User.count({ favorites: { $in: [article._id] } }).then(function(
    count
  ) {
    article.favoritesCount = count

    return article.save()
  })
}

articleSchema.methods.toJSONFor = function(user: IUserModel) {
  return {
    slug: this.slug,
    title: this.title,
    description: this.description,
    body: this.body,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    tagList: this.tagList,
    favorited: user ? user.isFavorite(this._id) : false,
    favoritesCount: this.favoritesCount,
    author: this.author.toProfileJSONFor(user)
  }
}

export const Article: Model<IArticleModel> = mongoose.model<IArticleModel>(
  'Article',
  articleSchema
)
