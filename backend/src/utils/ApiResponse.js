export const ok = (res, data = null, message = 'Success') =>
  res.status(200).json({ success: true, message, data });

export const created = (res, data = null, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

export const noContent = (res) => res.status(204).send();

export const paginated = (res, items, page, limit, total, message = 'Success') =>
  res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
