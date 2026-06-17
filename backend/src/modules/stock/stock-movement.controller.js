import { asyncHandler } from '../../utils/asyncHandler.js';
import { paginated } from '../../utils/ApiResponse.js';
import { stockMovementService } from './stock-movement.service.js';

export const stockMovementController = {
  list: asyncHandler(async (req, res) => {
    const { items, page, limit, total } = await stockMovementService.list(req.query);
    paginated(res, items, page, limit, total, 'Stock movements fetched');
  }),
};
